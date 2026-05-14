// LINE 訊息事件處理器
// 處理用戶傳入的文字訊息（訂單號查詢）

const { getFirestore } = require('firebase-admin/firestore');
const { buildOrderStatusMessage, buildOrderNotFoundMessage } = require('./richMessages');

// 12 碼訂單編號格式（YYMMDDHHMM+2碼亂數）
const ORDER_NO_REGEX = /^\d{12}$/;

/**
 * 處理 LINE message 事件
 * @param {object} client  - LINE Client 實例
 * @param {object} event   - LINE Webhook event
 */
async function handleMessage(client, event) {
  if (event.message.type !== 'text') return;

  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  // 訂單號查詢
  if (ORDER_NO_REGEX.test(text)) {
    await handleOrderQuery(client, replyToken, text);
    return;
  }

  // 關鍵字自動回覆
  const lower = text.toLowerCase();
  if (['訂購', '下單', '買', '購買'].some((kw) => lower.includes(kw))) {
    const liffOrderId = process.env.LIFF_ORDER_ID || '';
    const organizerId = process.env.ORGANIZER_ID || '';
    const url = liffOrderId
      ? `https://liff.line.me/${liffOrderId}?organizerId=${organizerId}`
      : '';
    await client.replyMessage(replyToken, {
      type: 'text',
      text: url ? `點擊下方連結立即訂購 🛒\n${url}` : '請透過訂購連結下單，謝謝！',
    });
    return;
  }
  if (['查詢', '訂單', '狀態', '查訂單'].some((kw) => lower.includes(kw))) {
    const liffStatusId = process.env.LIFF_STATUS_ID || '';
    const url = liffStatusId ? `https://liff.line.me/${liffStatusId}` : '';
    await client.replyMessage(replyToken, {
      type: 'text',
      text: `請輸入 13 碼訂單編號直接查詢，${url ? `\n或開啟查詢頁面：\n${url}` : ''}`,
    });
    return;
  }
}

/**
 * 依訂單編號查詢 Firestore 並回覆
 */
async function handleOrderQuery(client, replyToken, orderNo) {
  const db = getFirestore();

  const snap = await db
    .collection('GroupSessionOrders')
    .where('orderNo', '==', orderNo)
    .limit(1)
    .get();

  if (snap.empty) {
    await client.replyMessage(replyToken, buildOrderNotFoundMessage(orderNo));
    return;
  }

  const orderData = snap.docs[0].data();

  // 取得對應 session 狀態
  let sessionStatus = 'open';
  try {
    const sessionSnap = await db.collection('GroupSessions').doc(orderData.sessionId).get();
    if (sessionSnap.exists) {
      sessionStatus = sessionSnap.data().status || 'open';
    }
  } catch (_) {
    // 取不到 session 時不影響回覆
  }

  const card = buildOrderStatusMessage({ ...orderData, sessionStatus });
  await client.replyMessage(replyToken, card);
}

module.exports = { handleMessage };

/**
 * 依訂單編號查詢 Firestore 並回覆
 */
async function handleOrderQuery(client, replyToken, orderNo) {
  const db = getFirestore();

  const snap = await db
    .collection('GroupSessionOrders')
    .where('orderNo', '==', orderNo)
    .limit(1)
    .get();

  if (snap.empty) {
    const liffStatusUrl = process.env.LIFF_STATUS_URL || '';
    const messages = [
      buildOrderNotFoundMessage(orderNo),
    ];
    if (liffStatusUrl) {
      messages.push({
        type: 'text',
        text: liffStatusUrl,
      });
    }
    await client.replyMessage(replyToken, messages);
    return;
  }

  const orderData = snap.docs[0].data();

  // 取得對應 session 狀態（附加 sessionStatus 給模板用）
  let sessionStatus = 'open';
  try {
    const sessionSnap = await db.collection('GroupSessions').doc(orderData.sessionId).get();
    if (sessionSnap.exists) {
      sessionStatus = sessionSnap.data().status || 'open';
    }
  } catch (_) {
    // 取不到 session 時不影響回覆
  }

  const card = buildOrderStatusMessage({ ...orderData, sessionStatus });
  await client.replyMessage(replyToken, card);
}

module.exports = { handleMessage };
