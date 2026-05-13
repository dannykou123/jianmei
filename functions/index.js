/**
 * 健美滷味 Cloud Functions
 *
 * 環境變數設定方式（Firebase Console → Functions → 環境設定）：
 *   LINE_CHANNEL_SECRET       → LINE Developers → Messaging API Channel Secret
 *   LINE_CHANNEL_ACCESS_TOKEN → LINE Developers → Messaging API Channel Access Token
 *   LINE_LIFF_CHANNEL_ID      → LINE Developers → LIFF App 對應的 Channel ID
 *   LIFF_ID                   → LINE Developers → LIFF App ID（格式：1234567890-xxxxxxxx）
 *
 * 本地開發：在 functions/.env.local 填入上述變數（已加入 .gitignore）
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');
const { handleWebhook } = require('./line/webhook');
const { onSessionStatusChanged } = require('./line/pushNotification');

admin.initializeApp();
const db = admin.firestore();

const DELIVERY_STATUSES = ['preparing', 'shipped', 'delivering', 'delivered', 'exception'];

const STATUS_LABELS = {
  preparing:  '備貨中 📦',
  shipped:    '已出貨 🚚',
  delivering: '配送中 🏃',
  delivered:  '已送達 ✅',
  exception:  '配送異常 ⚠️',
};

const DEFAULT_TEMPLATES = {
  preparing:  '【健美滷味】{{用戶姓名}}，您的訂單正在備貨中 📦\n\n如有問題歡迎聯繫我們！',
  shipped:    '【健美滷味】{{用戶姓名}}，您的訂單已出貨！🚚\n預計送達：{{預計送貨日}}\n\n感謝您的支持！',
  delivering: '【健美滷味】{{用戶姓名}}，您的訂單正在配送中 🏃\n預計今日送達：{{預計送貨日}}',
  delivered:  '【健美滷味】{{用戶姓名}}，您的訂單已送達！✅\n\n感謝您的光顧，期待下次開團！',
  exception:  '【健美滷味】{{用戶姓名}}，您的訂單發生異常 ⚠️\n說明：{{備註}}\n\n我們將盡快與您聯繫，造成不便敬請見諒。',
};

// ── 工具函式 ──────────────────────────────────────────────────────────

function renderTemplate(body, vars) {
  return body.replace(/\{\{(.+?)\}\}/g, (_, key) => vars[key.trim()] ?? '');
}

async function verifyAdmin(uid) {
  const snap = await db.collection('Accounts').doc(uid).get();
  if (!snap.exists) return false;
  const d = snap.data();
  return d.isAuthorized === true && d.role === 'admin';
}

async function pushLineMessage(lineUserId, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
  const res = await axios.post(
    'https://api.line.me/v2/bot/message/push',
    { to: lineUserId, messages: [{ type: 'text', text }] },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// ── 1. generateBindingToken ───────────────────────────────────────────
exports.generateBindingToken = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '請先登入');

  const liffId = process.env.LIFF_ID;
  if (!liffId) throw new HttpsError('internal', 'LIFF_ID 環境變數未設定');

  const uid = request.auth.uid;
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // 作廢同用戶未使用的舊 Token
  const existingSnap = await db.collection('lineBindingTokens')
    .where('userId', '==', uid)
    .where('isUsed', '==', false)
    .get();

  const batch = db.batch();
  existingSnap.docs.forEach((d) => batch.update(d.ref, { isUsed: true }));

  const tokenRef = db.collection('lineBindingTokens').doc();
  batch.set(tokenRef, {
    userId: uid,
    token,
    isUsed: false,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { token, liffUrl: `https://liff.line.me/${liffId}?token=${token}` };
});

// ── 2. liffBind ───────────────────────────────────────────────────────
exports.liffBind = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { bindingToken, lineIdToken } = req.body || {};
  if (!bindingToken || !lineIdToken) {
    return res.status(400).json({ success: false, message: '缺少必要參數' });
  }

  // LIFF ID 格式為 "{channelId}-{suffix}"，前半段即為驗證用 Channel ID
  const liffId = process.env.LIFF_ID;
  const liffChannelId = liffId ? liffId.split('-')[0] : process.env.LINE_LIFF_CHANNEL_ID;
  if (!liffChannelId) {
    return res.status(500).json({ success: false, message: 'LIFF_ID 環境變數未設定' });
  }

  // Step 1：向 LINE 官方驗證 ID Token
  let lineProfile;
  try {
    const verifyRes = await axios.post(
      'https://api.line.me/oauth2/v2.1/verify',
      new URLSearchParams({ id_token: lineIdToken, client_id: liffChannelId }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    lineProfile = verifyRes.data;
  } catch (err) {
    const lineErr = err.response?.data;
    console.error('LINE verify failed:', lineErr || err.message);
    return res.status(401).json({
      success: false,
      message: `LINE 身分驗證失敗：${lineErr?.error_description || lineErr?.error || err.message}`,
    });
  }

  const lineUserId = lineProfile.sub;

  // Step 2：Transaction 驗證 Token + 完成綁定
  try {
    await db.runTransaction(async (t) => {
      const tokenQuery = await db.collection('lineBindingTokens')
        .where('token', '==', bindingToken)
        .where('isUsed', '==', false)
        .limit(1)
        .get();

      if (tokenQuery.empty) throw new Error('INVALID_TOKEN');

      const tokenDoc = tokenQuery.docs[0];
      if (tokenDoc.data().expiresAt.toDate() < new Date()) throw new Error('TOKEN_EXPIRED');

      const { userId } = tokenDoc.data();

      t.update(tokenDoc.ref, { isUsed: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });

      t.update(db.collection('Organizers').doc(userId), {
        lineUserId,
        lineDisplayName: lineProfile.name || '',
        linePictureUrl:  lineProfile.picture || '',
        lineBoundAt:     admin.firestore.FieldValue.serverTimestamp(),
        isLineBound:     true,
        updatedAt:       new Date().toISOString(),
      });

      t.set(
        db.collection('lineBindings').doc(lineUserId),
        { lineUserId, userId, displayName: lineProfile.name || '', pictureUrl: lineProfile.picture || '', boundAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    });
  } catch (err) {
    if (err.message === 'INVALID_TOKEN')  return res.status(400).json({ success: false, message: '連結已失效或已使用，請重新申請' });
    if (err.message === 'TOKEN_EXPIRED')  return res.status(400).json({ success: false, message: '連結已過期（15分鐘內有效），請重新申請' });
    console.error('liffBind error:', err);
    return res.status(500).json({ success: false, message: '系統錯誤，請稍後再試' });
  }

  // Step 3：發送綁定成功確認訊息（非致命）
  try {
    await pushLineMessage(
      lineUserId,
      `✅ ${lineProfile.name || '您'}，您已成功綁定健美滷味團購系統！\n\n往後訂單備貨、出貨、配送等狀態更新，都會即時通知您。\n\n如需取消綁定，請至後台「個人資料」頁面操作。`
    );
  } catch (err) {
    console.error('Binding confirmation message failed:', err.message);
  }

  // Step 3 (already done above): 綁定成功確認訊息 → Step 4: 取得加入好友連結
  let addFriendUrl = null;
  try {
    const botRes = await axios.get(
      'https://api.line.me/v2/bot/info',
      { headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` } }
    );
    const basicId = botRes.data.basicId; // e.g. "@AbcDefg"
    if (basicId) {
      addFriendUrl = `https://line.me/R/ti/p/~${basicId.replace('@', '')}`;
    }
  } catch (err) {
    console.warn('Failed to get bot basicId:', err.message);
  }

  return res.json({ success: true, message: '綁定成功', addFriendUrl });
});

// ── 3. updateDeliveryStatus ───────────────────────────────────────────
exports.updateDeliveryStatus = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '請先登入');
  if (!(await verifyAdmin(request.auth.uid))) throw new HttpsError('permission-denied', '無管理員權限');

  const { groupOrderId, status, estimatedDeliveryDate, note, shouldNotify } = request.data;

  if (!groupOrderId || !status) throw new HttpsError('invalid-argument', '缺少必要參數');
  if (!DELIVERY_STATUSES.includes(status)) throw new HttpsError('invalid-argument', '無效的配送狀態');

  const groupOrderRef = db.collection('GroupOrders').doc(groupOrderId);
  const groupOrderSnap = await groupOrderRef.get();
  if (!groupOrderSnap.exists) throw new HttpsError('not-found', '找不到該訂單');

  const { organizerUid } = groupOrderSnap.data();
  const organizerSnap = await db.collection('Organizers').doc(organizerUid).get();
  const organizer = organizerSnap.exists ? organizerSnap.data() : null;

  const batch = db.batch();
  batch.update(groupOrderRef, {
    currentDeliveryStatus: status,
    estimatedDeliveryDate: estimatedDeliveryDate || null,
    deliveryNote:          note || '',
    updatedAt:             admin.firestore.FieldValue.serverTimestamp(),
  });

  const historyRef = groupOrderRef.collection('deliveryStatusHistory').doc();
  batch.set(historyRef, {
    status,
    estimatedDeliveryDate: estimatedDeliveryDate || null,
    note:                  note || '',
    notificationTriggered: false,
    changedBy:             request.auth.uid,
    createdAt:             admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  if (!shouldNotify || !organizer?.isLineBound || !organizer?.lineUserId) {
    return { success: true, notified: false };
  }

  // 確認用戶通知偏好
  const prefSnap = await db.collection('userNotificationPreferences').doc(`${organizerUid}_${status}`).get();
  if (prefSnap.exists && !prefSnap.data().isEnabled) {
    await db.collection('notificationLogs').add({
      groupOrderId, userId: organizerUid, status, result: 'skipped',
      reason: 'user_preference_disabled', sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, notified: false, reason: '用戶已關閉此狀態通知' };
  }

  // 載入範本
  const templateSnap = await db.collection('notificationTemplates').doc(`default_${status}`).get();
  const templateBody = templateSnap.exists ? templateSnap.data().body : (DEFAULT_TEMPLATES[status] || STATUS_LABELS[status]);

  const renderedBody = renderTemplate(templateBody, {
    用戶姓名:  organizer.name || organizer.displayName || '',
    預計送貨日: estimatedDeliveryDate || '待確認',
    備註:       note || '',
  });

  try {
    await pushLineMessage(organizer.lineUserId, renderedBody);
    await db.collection('notificationLogs').add({
      groupOrderId, userId: organizerUid, status, renderedBody, result: 'success',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await historyRef.update({ notificationTriggered: true });
    return { success: true, notified: true };
  } catch (err) {
    await db.collection('notificationLogs').add({
      groupOrderId, userId: organizerUid, status, renderedBody, result: 'failed',
      errorMessage: err.message, sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new HttpsError('internal', `LINE 通知發送失敗：${err.message}`);
  }
});

// ── 4. saveNotificationTemplate ───────────────────────────────────────
exports.saveNotificationTemplate = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '請先登入');
  if (!(await verifyAdmin(request.auth.uid))) throw new HttpsError('permission-denied', '無管理員權限');

  const { status, body } = request.data;
  if (!status || !body) throw new HttpsError('invalid-argument', '缺少 status 或 body');
  if (!DELIVERY_STATUSES.includes(status)) throw new HttpsError('invalid-argument', '無效的配送狀態');

  await db.collection('notificationTemplates').doc(`default_${status}`).set({
    status, body, isActive: true, updatedBy: request.auth.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ── 5. lineWebhook ────────────────────────────────────────────────────
exports.lineWebhook = onRequest(
  { region: 'asia-northeast1' },
  handleWebhook
);

// ── 6. lineNotifyOnSessionStatusChanged ───────────────────────────────
exports.lineNotifyOnSessionStatusChanged = onSessionStatusChanged;
