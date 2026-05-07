// Firebase Cloud Functions 入口
// 使用 firebase-functions v2 (gen-2)

const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { handleWebhook } = require('./line/webhook');
const { onSessionStatusChanged } = require('./line/pushNotification');

// 初始化 Firebase Admin SDK（只呼叫一次）
initializeApp();

/**
 * LINE Webhook endpoint
 * POST https://asia-northeast1-jianmei-food-54760.cloudfunctions.net/lineWebhook
 *
 * 在 LINE Developer Console 設定此 URL 為 Webhook URL
 */
exports.lineWebhook = onRequest(
  {
    region: 'asia-northeast1', // 東京，減少 LINE 到台灣的延遲
    secrets: [
      'LINE_CHANNEL_SECRET',
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LIFF_ORDER_ID',
      'LIFF_STATUS_ID',
      'ORGANIZER_ID',
    ],
  },
  handleWebhook
);

/**
 * Firestore 觸發器：GroupSession 狀態變更時推播 LINE 通知
 */
exports.lineNotifyOnSessionStatusChanged = onSessionStatusChanged;
