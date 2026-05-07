// LINE Webhook 主入口
// 驗證簽章 → 路由事件到對應 handler

const { Client, validateSignature } = require('@line/bot-sdk');
const { handleMessage } = require('./messageHandler');
const { buildWelcomeMessage } = require('./richMessages');

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleWebhook(req, res) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  // 驗證 LINE 簽章（防止偽造請求）
  const signature = req.headers['x-line-signature'];
  const rawBody = JSON.stringify(req.body);

  if (!validateSignature(rawBody, channelSecret, signature)) {
    res.status(401).send('Invalid signature');
    return;
  }

  const client = new Client({ channelAccessToken });
  const events = req.body.events || [];

  await Promise.all(events.map((event) => routeEvent(client, event)));

  res.status(200).send('OK');
}

async function routeEvent(client, event) {
  try {
    switch (event.type) {
      case 'follow':
        await handleFollow(client, event);
        break;
      case 'message':
        await handleMessage(client, event);
        break;
      default:
        // 忽略其他事件（unfollow、postback 等）
        break;
    }
  } catch (err) {
    console.error(`LINE event error [${event.type}]:`, err);
  }
}

async function handleFollow(client, event) {
  const shopName = process.env.SHOP_NAME || '商家';
  const address = process.env.SHOP_ADDRESS || '（未設定地址）';
  const openingHours = process.env.SHOP_OPENING_HOURS || '（未設定營業時間）';
  const phone = process.env.SHOP_PHONE || '（未設定電話）';
  const liffOrderId = process.env.LIFF_ORDER_ID || '';
  const liffStatusId = process.env.LIFF_STATUS_ID || '';
  const organizerId = process.env.ORGANIZER_ID || '';

  const orderLiffUrl = liffOrderId
    ? `https://liff.line.me/${liffOrderId}?organizerId=${organizerId}`
    : '';
  const statusLiffUrl = liffStatusId
    ? `https://liff.line.me/${liffStatusId}`
    : '';

  const welcomeMsg = buildWelcomeMessage({
    shopName,
    address,
    openingHours,
    phone,
    orderLiffUrl,
    statusLiffUrl,
  });

  await client.replyMessage(event.replyToken, welcomeMsg);
}

module.exports = { handleWebhook };
