// 訂單狀態變更推播通知
// Firestore onUpdate 觸發器：監聽 GroupSessions 狀態異動
// 注意：後台接單/拒單的通知已由 notifySessionStatusChange callable 明確處理，
//       此觸發器保留結構但不重複發送，避免客戶收到通知或團購主收到重複訊息。

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

const onSessionStatusChanged = onDocumentUpdated(
  'GroupSessions/{sessionId}',
  async (event) => {
    // 通知由 notifySessionStatusChange callable 統一處理，此處不重複發送
    return;
  }
);

module.exports = { onSessionStatusChanged };
