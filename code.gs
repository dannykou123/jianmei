const SSID = '1Xy_-YuKt4iAlD6o95f5txJlasq9uXYGeXqvbCXK2OQQ'; 

function doGet(e) {
  return ContentService.createTextOutput("API 運作中").setMimeType(ContentService.MimeType.TEXT);
}

// 核心修改：處理來自外部網域的請求
function doPost(e) {
  let requestData;
  try {
    requestData = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ success: false, message: "無效的 JSON 格式" });
  }

  const action = requestData.action;
  let result;

  try {
    switch (action) {
      case 'validateOrderCode':
        result = validateOrderCode(requestData.code);
        break;
      case 'submitOrder':
        result = submitOrder(requestData.orderData);
        break;
      case 'loginUser':
        result = loginUser(requestData.id, requestData.pass);
        break;
      case 'getDashboardData':
        result = getDashboardData(requestData.role, requestData.companyId, requestData.dateStr);
        break;
      case 'getGroupOrderDetails':
        result = getGroupOrderDetails(requestData.groupOrderId);
        break;
      case 'createGroupOrder':
        result = createGroupOrder(requestData.companyId, requestData.companyName);
        break;
      case 'setPaidStatus':
        result = setPaidStatus(requestData.orderIds, requestData.isPaid);
        break;
      case 'closeGroupOrder':
        result = closeGroupOrder(requestData.groupOrderId);
        break;
      default:
        result = { success: false, message: "未知的 action" };
    }
  } catch (err) {
    result = { success: false, message: "伺服器錯誤: " + err.toString() };
  }

  return createResponse(result);
}

function createResponse(data) {
  // 必須明確設定為 JSON 類型，這能幫助瀏覽器理解回傳內容
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- API 功能區 ---

// 1. [新功能] 驗證訂單序號 (客戶進入點)
function validateOrderCode(code) {
  const ss = SpreadsheetApp.openById(SSID);
  const ws = ss.getSheetByName('GroupOrders');
  const data = ws.getDataRange().getValues();
  
  // 尋找 code 符合且 status 為 OPEN 的團購 (忽略大小寫)
  // code 在 B欄 (索引1), status 在 E欄 (索引4)
  const groupOrder = data.slice(1).find(row => String(row[1]).toUpperCase() === String(code).toUpperCase() && row[4] === 'OPEN');
  
  if (!groupOrder) {
    return { success: false, message: '序號錯誤或團購已結束' };
  }

  // 取得該公司的商品清單
  const items = ss.getSheetByName('Items').getDataRange().getValues().slice(1)
    .filter(row => row[4] === 'ON')
    .map(row => ({ id: row[0], name: row[1], price: row[2], category: row[3] }));

  return { 
    success: true, 
    groupOrderId: groupOrder[0],
    companyId: groupOrder[2],
    companyName: groupOrder[3],
    items: items
  };
}

// 2. [修改] 提交訂單 (需包含 groupOrderId)
function submitOrder(orderData) {
  const ss = SpreadsheetApp.openById(SSID);
  const ws = ss.getSheetByName('Orders');
  
  const rows = orderData.items.map(item => [
    Utilities.getUuid(),
    orderData.groupOrderId, // 新增：場次ID (寫入B欄)
    orderData.companyId,
    orderData.companyName,
    orderData.buyerName,
    item.id,
    item.name,
    item.qty,
    item.qty * item.price,
    false, 
    new Date(), 
    orderData.note || ''
  ]);
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (rows.length > 0) ws.getRange(ws.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } catch (e) { throw new Error('系統忙碌'); } finally { lock.releaseLock(); }
  
  return { success: true };
}

// 3. 登入驗證
function loginUser(id, password) {
  const ss = SpreadsheetApp.openById(SSID);
  const companies = ss.getSheetByName('Companies').getDataRange().getValues().slice(1);
  const target = companies.find(r => String(r[0]).toUpperCase() === String(id).toUpperCase() && String(r[3]) === String(password));

  if (!target) return { success: false, message: '帳號或密碼錯誤' };
  const role = (String(target[0]).toUpperCase() === 'ADMIN') ? 'ADMIN' : 'LEADER';
  
  return { success: true, role: role, companyId: target[0], companyName: target[1] };
}

// 4. [新功能] 團購主發起新團購
function createGroupOrder(companyId, companyName) {
  const ss = SpreadsheetApp.openById(SSID);
  const ws = ss.getSheetByName('GroupOrders');
  
  // 產生 6 碼亂數序號 (英文+數字)
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const id = Utilities.getUuid();
  
  ws.appendRow([id, code, companyId, companyName, 'OPEN', new Date()]);
  
  return { success: true, code: code, groupOrderId: id };
}

// 5. 獲取儀表板資料 (含團購場次管理)
function getDashboardData(role, companyId, dateStr) {
  const ss = SpreadsheetApp.openById(SSID);

  // --- ADMIN: 看當日總匯總 + 依照序號分組 ---
  if (role === 'ADMIN') {
    const ws = ss.getSheetByName('Orders');
    const groupWs = ss.getSheetByName('GroupOrders');
    
    // 1. 取得當日訂單 (createdAt 在 Col 11, index 10)
    const ordersData = ws.getDataRange().getValues().slice(1);
    const filteredOrders = ordersData.filter(row => {
      if (!row[10]) return false; 
      return Utilities.formatDate(new Date(row[10]), 'Asia/Taipei', 'yyyy-MM-dd') === dateStr;
    });

    // 2. 準備資料容器
    const stockMap = {};     // 備貨用 (混和)
    const labelMap = {};     // 標籤用 (混和)
    const groupsMap = {};    // 檢視用 (依序號分組)

    // 3. 預先抓取 GroupOrders 以便查詢「序號代碼 (Code)」
    // GroupOrders 結構: [id, code, companyId, companyName, status, createdAt]
    const groupData = groupWs.getDataRange().getValues().slice(1);
    const groupInfoMap = {};
    groupData.forEach(r => {
      groupInfoMap[r[0]] = { code: r[1], companyName: r[3] };
    });

    filteredOrders.forEach(row => {
      // 欄位對應: 
      // [0]orderId, [1]groupOrderId, [2]companyId, [3]companyName, 
      // [4]buyerName, [5]itemId, [6]itemName, [7]qty, [8]amount, [9]paid, [10]createdAt, [11]note
      
      const groupOrderId = row[1];
      const buyerName = row[4];
      const itemName = row[6];
      const qty = Number(row[7]);
      const amount = Number(row[8]);
      const note = row[11];

      // A. 備貨統計 (全部加總)
      stockMap[itemName] = (stockMap[itemName] || 0) + qty;
      
      // B. 標籤資料 (全部依人名)
      const labelKey = `[${row[3]}] ${buyerName}`; 
      if (!labelMap[labelKey]) labelMap[labelKey] = { title: labelKey, items: [], total: 0 };
      labelMap[labelKey].items.push({ name: itemName, qty: qty, note: note });
      labelMap[labelKey].total += amount;

      // C. [新功能] 依照團購序號分組
      if (!groupsMap[groupOrderId]) {
        const info = groupInfoMap[groupOrderId] || { code: 'Unknown', companyName: row[3] };
        groupsMap[groupOrderId] = {
          groupOrderId: groupOrderId,
          code: info.code,
          companyName: info.companyName,
          buyers: {}, // 用物件暫存以免人名重複
          total: 0
        };
      }
      
      // 該序號下的訂購人
      const currentGroup = groupsMap[groupOrderId];
      if (!currentGroup.buyers[buyerName]) {
        currentGroup.buyers[buyerName] = { name: buyerName, items: [], total: 0, paid: row[9] };
      }
      
      currentGroup.buyers[buyerName].items.push(`${itemName} x${qty}` + (note ? `(${note})` : ''));
      currentGroup.buyers[buyerName].total += amount;
      currentGroup.total += amount;
    });

    // 整理 Groups 轉為陣列
    const groupList = Object.values(groupsMap).map(g => {
      g.buyers = Object.values(g.buyers); // 轉陣列
      return g;
    });

    return {
      stockList: Object.keys(stockMap).map(k => ({ name: k, qty: stockMap[k] })),
      labelList: Object.values(labelMap),
      groupList: groupList // 回傳新的結構
    };
  } 
  
  // --- LEADER (維持不變) ---
  else {
    const groupWs = ss.getSheetByName('GroupOrders');
    const groups = groupWs.getDataRange().getValues().slice(1)
      .filter(row => String(row[2]) === String(companyId))
      .map(row => ({
        id: row[0],
        code: row[1],
        status: row[4],
        date: Utilities.formatDate(new Date(row[5]), 'Asia/Taipei', 'yyyy-MM-dd HH:mm')
      }))
      .reverse();
    return { groups: groups };
  }
}

// 6. [新功能] 取得特定團購場次的明細 (團購主用)
function getGroupOrderDetails(groupOrderId) {
  const ss = SpreadsheetApp.openById(SSID);
  const data = ss.getSheetByName('Orders').getDataRange().getValues().slice(1);
  
  // 篩選 groupOrderId (Column B, index 1)
  const filtered = data.filter(row => row[1] === groupOrderId);
  
  const buyerMap = {};
  let total = 0;
  
  filtered.forEach(row => {
    // buyer: row[4], itemName: row[6], qty: row[7], amount: row[8], paid: row[9], note: row[11]
    const buyer = row[4];
    if (!buyerMap[buyer]) {
      buyerMap[buyer] = { name: buyer, items: [], total: 0, paid: true, orderIds: [] };
    }
    buyerMap[buyer].items.push(`${row[6]} x${row[7]}` + (row[11] ? `(${row[11]})` : ''));
    buyerMap[buyer].total += row[8];
    if (!row[9]) buyerMap[buyer].paid = false;
    buyerMap[buyer].orderIds.push(row[0]);
    total += row[8];
  });

  return { list: Object.values(buyerMap), totalAmount: total };
}

// 7. 更新付款 (索引修正)
function setPaidStatus(orderIds, isPaid) {
  const ss = SpreadsheetApp.openById(SSID);
  const ws = ss.getSheetByName('Orders');
  const data = ws.getDataRange().getValues();
  // 欄位 I 是 paid，原本是 index 8，插入一欄後變 index 9 (第10欄)
  for (let i = 1; i < data.length; i++) {
    if (orderIds.includes(data[i][0])) {
      ws.getRange(i + 1, 10).setValue(isPaid); 
    }
  }
}

// 8. 關閉團購
function closeGroupOrder(groupOrderId) {
  const ss = SpreadsheetApp.openById(SSID);
  const ws = ss.getSheetByName('GroupOrders');
  const data = ws.getDataRange().getValues();
  for(let i=1; i<data.length; i++){
    if(data[i][0] == groupOrderId) {
      ws.getRange(i+1, 5).setValue('CLOSED'); // Status column
      return { success: true };
    }
  }
  return { success: false };
}