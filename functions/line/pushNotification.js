// 訂單狀態變更推播通知
// Firestore onUpdate 觸發器：監聽 GroupSessions 狀態異動 → 推播給綁定 LINE 帳號的用戶

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getFirestore } = require('firebase-admin/firestore');
const { Client } = require('@line/bot-sdk');
const { buildStatusUpdateMessage } = require('./richMessages');

/**
 * 監聽 GroupSessions/{sessionId} 狀態變更
 * 當狀態變為 approved/rejected 時，找出所有相關訂單的 LINE 綁定並推播
 */
const onSessionStatusChanged = onDocumentUpdated(
  'GroupSessions/{sessionId}',
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // 只處理 approved 或 rejected 的狀態轉換
    const notifiableStatuses = ['approved', 'rejected'];
    if (before.status === after.status) return;
    if (!notifiableStatuses.includes(after.status)) return;

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      console.error('[pushNotification] LINE_CHANNEL_ACCESS_TOKEN 未設定');
      return;
    }

    const client = new Client({ channelAccessToken });
    const db = getFirestore();
    const sessionId = event.params.sessionId;

    // 取出此 session 下所有訂單
    const ordersSnap = await db
      .collection('GroupSessionOrders')
      .where('sessionId', '==', sessionId)
      .get();

    if (ordersSnap.empty) return;

    const pushPromises = ordersSnap.docs.map(async (orderDoc) => {
      const order = orderDoc.data();
      if (!order.orderNo) return;

      // 查詢是否有 LINE 綁定
      const bindingSnap = await db
        .collection('lineBindings')
        .where('orderNos', 'array-contains', order.orderNo)
        .limit(1)
        .get();

      if (bindingSnap.empty) return;

      const lineUserId = bindingSnap.docs[0].data().lineUserId;
      const message = buildStatusUpdateMessage(order, after.status);

      try {
        await client.pushMessage(lineUserId, message);
      } catch (err) {
        console.error(`推播失敗 [lineUserId=${lineUserId}]:`, err.message);
      }
    });

    await Promise.all(pushPromises);
  }
);

module.exports = { onSessionStatusChanged };
