// LINE Flex Message 模板集

/**
 * 新追蹤者歡迎訊息
 * @param {object} opts
 * @param {string} opts.shopName       - 商家名稱
 * @param {string} opts.address        - 地址
 * @param {string} opts.openingHours   - 營業時間
 * @param {string} opts.phone          - 聯絡電話
 * @param {string} opts.orderLiffUrl   - 訂購 LIFF 網址
 * @param {string} opts.statusLiffUrl  - 查詢訂單 LIFF 網址
 */
function buildWelcomeMessage({ shopName, address, openingHours, phone, orderLiffUrl, statusLiffUrl }) {
  return {
    type: 'flex',
    altText: `歡迎加入 ${shopName}！`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#B0736A',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `🏪 ${shopName}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
          },
          {
            type: 'text',
            text: '感謝您的加入！',
            color: '#FFE4E1',
            size: 'sm',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          buildInfoRow('📍', '地址', address),
          buildInfoRow('🕐', '營業時間', openingHours),
          buildInfoRow('📞', '電話', phone),
          { type: 'separator', margin: 'md' },
          {
            type: 'text',
            text: '輸入 13 碼訂單編號可直接查詢訂單狀態',
            size: 'xs',
            color: '#999999',
            margin: 'md',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#B0736A',
            action: {
              type: 'uri',
              label: '🛒 立即訂購',
              uri: orderLiffUrl,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'uri',
              label: '📦 查詢我的訂單',
              uri: statusLiffUrl,
            },
          },
        ],
      },
    },
  };
}

/**
 * 訂單狀態查詢結果卡片（單筆）
 * @param {object} order - groupSessionOrders 文件資料
 */
function buildOrderStatusMessage(order) {
  const statusMap = {
    open: { label: '開放中', color: '#3B82F6' },
    pending: { label: '審核中', color: '#F59E0B' },
    approved: { label: '已核准', color: '#10B981' },
    rejected: { label: '已拒絕', color: '#EF4444' },
    closed: { label: '已結束', color: '#6B7280' },
  };

  const sessionStatus = order.sessionStatus || 'open';
  const badge = statusMap[sessionStatus] || { label: sessionStatus, color: '#6B7280' };

  // 商品明細列
  const itemRows = (order.items || []).map((item) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: item.itemName, size: 'sm', color: '#555555', flex: 3, wrap: true },
      { type: 'text', text: `x${item.qty}`, size: 'sm', color: '#555555', flex: 1, align: 'center' },
      { type: 'text', text: `$${item.subtotal}`, size: 'sm', color: '#333333', flex: 2, align: 'end' },
    ],
  }));

  return {
    type: 'flex',
    altText: `訂單 ${order.orderNo} 狀態查詢`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#F5EBE0',
        paddingAll: '14px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            flex: 1,
            contents: [
              { type: 'text', text: '訂單查詢', size: 'xs', color: '#999999' },
              { type: 'text', text: order.orderNo, size: 'md', weight: 'bold', color: '#3D3D3D' },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            alignItems: 'flex-end',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: badge.color,
                cornerRadius: '12px',
                paddingAll: '6px',
                paddingStart: '10px',
                paddingEnd: '10px',
                contents: [
                  { type: 'text', text: badge.label, color: '#FFFFFF', size: 'xs', weight: 'bold' },
                ],
              },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        contents: [
          buildInfoRow('👤', '訂購人', order.customerName || '—'),
          buildInfoRow('🏢', '單位', order.customerUnit || '—'),
          { type: 'separator', margin: 'sm' },
          ...itemRows,
          { type: 'separator', margin: 'sm' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '合計', size: 'sm', color: '#555555', flex: 3, weight: 'bold' },
              {
                type: 'text',
                text: `$${order.totalAmount}`,
                size: 'sm',
                color: '#B0736A',
                flex: 3,
                align: 'end',
                weight: 'bold',
              },
            ],
          },
          order.note
            ? buildInfoRow('📝', '備註', order.note)
            : null,
        ].filter(Boolean),
      },
    },
  };
}

/**
 * 訂單狀態推播通知（訂單審核結果）
 * @param {object} order
 * @param {string} newStatus - 'approved' | 'rejected'
 */
function buildStatusUpdateMessage(order, newStatus) {
  if (newStatus === 'approved') {
    return {
      type: 'text',
      text: `✅ 您的訂單 ${order.orderNo} 已核准！\n訂購人：${order.customerName}\n金額：$${order.totalAmount}\n\n如有任何問題請直接傳訊給我們。`,
    };
  }
  if (newStatus === 'rejected') {
    const reason = order.rejectedReason ? `\n原因：${order.rejectedReason}` : '';
    return {
      type: 'text',
      text: `❌ 您的訂單 ${order.orderNo} 未通過審核。${reason}\n\n請重新訂購或聯繫我們。`,
    };
  }
  return {
    type: 'text',
    text: `📦 訂單 ${order.orderNo} 狀態已更新為：${newStatus}`,
  };
}

/**
 * 找不到訂單的回覆
 * @param {string} orderNo
 */
function buildOrderNotFoundMessage(orderNo) {
  return {
    type: 'text',
    text: `查無訂單「${orderNo}」\n\n請確認訂單編號（13碼數字）是否正確，或直接開啟查詢頁面：`,
  };
}

// ── 工具函式 ──────────────────────────────────────────
function buildInfoRow(icon, label, value) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `${icon} ${label}`, size: 'sm', color: '#999999', flex: 3 },
      { type: 'text', text: value, size: 'sm', color: '#3D3D3D', flex: 5, wrap: true },
    ],
  };
}

module.exports = {
  buildWelcomeMessage,
  buildOrderStatusMessage,
  buildStatusUpdateMessage,
  buildOrderNotFoundMessage,
};
