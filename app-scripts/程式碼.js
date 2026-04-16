// --- 核心設定區 ---
const FIREBASE_EMAIL = "firebase-adminsdk-fbsvc@jianmei-food-54760.iam.gserviceaccount.com";
const FIREBASE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfFFROxOko9e9Z\nn4Z+1xCAdi1M25GjE29M9Q4AHRucbM9/UE+kgPEyTdphhGEl4EN1wDNKhLqHQApo\nunGqfZabpI+7i7kG2TtMeMnIe9qy+rBhKZtCAno+SJLja+5a34INvaeD+WfkUFh+\nQWPUAOaG3VmlvblfFgRJBFSI/U6B5U9P4bydvlS0/4anyLBFm+oaZpDuPNbLYsYg\neT1Wea5o3d6IaDh2w4EqgEYuAaJ+VsZJR4+GTRPT5KbainlZTTTCmBawy2HG88Kx\nrshqzftS0Ne5/f/KilvSHspOFNRh7pScwvawJEGwzxla2/Smjlwa5e42k2rhrdZd\nv1KU8FQBAgMBAAECggEAC2OsUkE3bkHwMHE2mq88RnLCKVRkgSDy48j3KAZUbI4Z\nofRlvI5gwiK7bZMmqppil1Zyx/Ey3MjmPyaVuxCiadvjAr5FehYJMwRPuQ6pwc2O\nx8cqCBq8RwXJihbumnEi4LS4IsLPDRcVDY0lHaPWITiX5SBkoHgtS9UOw9e69GK6\nTvrvqXx3WAT8Eggzn2KsvBZCn9zeI68JNCE/xZpXgP9/uh+9HUFqjFk89D60B26Z\nbHfqUalV0z+wMG+ga0s087GzCzd/gO4qyw9slCkCnHLmDCcwVaOyjAzRuD/yzoyB\nJNARH7zae0HgJG+W29gL+f4XHjJIs6CylVDhJ7S+AQKBgQD/hb/YmSwQny4xkcjs\nyojYewUedjcKEtQHTZgiwlG2xr5a74DpNvX/xYxZBSWqM70iMLW9r8flP5laqS7N\n4tXYUVXvk0IWT8cvxwShehE2CBRh1GHkP8r7MgtfyqAiPRsk+so3JSjZx+6EY7xL\njRb4aAUm2/4iyj0Oqlm9Zq7mMQKBgQDffw7eBI/BEG/aSYumIf61S0wfhfx3JDFW\nEeNoGAylNPG0vr1w1lUYSeKJIAKpoSkbXmWJfhobtpuFt+AeTytKxr71nsumU2SZ\njjmO3yv0xOHpf5rYnAlFaEXG2trU10xYHr3+cs6OALiJdxFUrTaF+M1p1mu+sAvF\njralgkVG0QKBgGgyvYHxLGP21ZqHLZ1KFjXZLMQ4RseH2AjGXqTGAxZ6w0NH6ZSw\nwe40O8BNdgeLI7Rekq4wkV5t6fZriVeSCcw1lsqkjU2V6M8V5FCI+53B+7XNKsIu\nNXLr/HFqqpRrwLb6wh1svNTaT+yS00Un2tcfbAJlsaO0PuPNGd0/k1DxAoGBAIoN\nj/9wTePx5UWvHEX4xb7yzgjC2No3Twpdbl0ETftWot8E2zvyCQpByV7umPZzCFNR\nkeLGNBZeS97jX9sZCCLedWJ/Pkh1RrTbd45bKGm/m9SB8AJRECEBceiNk5LZktzz\n0GR2QkTRCSxQkjH99Kn4r9nqiw906zCTIRtHRsehAoGABS6ohBKEROxleJNDjb6g\n00QkOOiFRnGuyyI6+Kn14eE6lFRvRRqkfiTPmXlVekE3WzdhmrVJv1LJDejEv3HQ\n6lpFoXCWlWYpDbD7YQcJk4guSuToiWxbq5zALcyoWrLWFID1Eth7rJX018gdf6pC\nKVTsoMN/pZCfVXK5xBgG5r0=\n-----END PRIVATE KEY-----\n";
// --- 核心設定區 ---
const FIREBASE_PROJECT_ID = "jianmei-food-54760";

// --- 核心設定區 (LINE) ---
// 請填入您從 LINE Developers Console 取得的資料
const LINE_ACCESS_TOKEN = "MGNJUt8myQEjnQZW9M7514ncOQwwQV1ItvGPqZDDiJYXxdq57K6FTs8a6svZvBW9lxGsQ6hKLZml7TwWZjAYWqTrAYpiBh1OdMD/UOeZ6Vf9YeXNo/Ls+DrpUIYhXAEeKSmH/6Y7T/pT85JwLfR6fwdB04t89/1O/w1cDnyilFU="; 
const LINE_USER_ID = "Ubf1393a607012aecc04e6e3ed17546bd";

function finalDateTest() {
  var list = [
    "2026/03/20 1800",
    "2026/03/20 下午 12:00:00",
    "115/03/20 1800",
    "20260320 0930 PM",
    "2026.03.20下午6點",
    "2026.03.20 18:00",
    "2026-3-20 1800",
    "2026-03-20-1800",
    "2026年3月20日下午18點",
    "這禮拜五1800",
    "這周五18點",
    "2026/03/20 18:00:00",
    "下禮拜五下午3點",
    "下禮拜一 0930",
    "週六下午3點",
    "明天 1200",
    "2026/03/20 1800",
    "115-03-20下午12:00",
    "現在"
  ];
  
  list.forEach(function(s) {
    var res = smartParseDate(s);
    console.log("輸入: " + s + " => 解析結果: " + Utilities.formatDate(res, "GMT+8", "yyyy-MM-dd HH:mm:ss"));
  });
}

// 手動測試：請找一個你已經上傳過的 Excel 檔案 ID 貼進來測試
function manualTest() {
  var testFileId = "1ZT4j7nHFUu4WPUe23divtCIBS26Q3M07"; 
  try {
    console.log("--- 開始手動測試 ---");
    
    // 測試 A: 直接看 LINE 連不連得通
    console.log("正在測試 LINE 發送...");
    //sendLinePush("手動測試啟動：正在處理檔案 " + testFileId);
    
    // 測試 B: 執行核心解析與上傳
    var result = processAndUpload(testFileId);
    
    console.log("測試完成！產生的 GroupID: " + result);
    var infoMessage = "\n✅ 健美滷味 - 測試訂單通知！" +
                      "\n------------------------" +
                      "\n🏢 單位名稱: " + result.companyName + 
                      "\n📅 交貨時間: " + result.deliveryTimeStr +
                      "\n👤 聯絡人: " + result.contactName +  
                      "\n📞 電話: " + result.contactPhone;
    
    sendLinePush(infoMessage);

  } catch (e) {
    console.error("手動測試失敗: " + e.message);
    // 失敗也傳 LINE 告訴你為什麼失敗
    sendLinePush("❌ 手動測試失敗：\n" + e.message);
  }
}

/**
 * 1. 表單提交觸發：處理多檔案並發送 LINE 通知
 */
function onFormSubmit(e) {
  console.log("--- 觸發成功：開始執行 onFormSubmit ---");
  try {
    var responses = e.values; 
    
    // 關鍵修正 1：直接指定抓取 B 欄 (索引為 1)
    var rawFileUrls = responses[1]; 
    console.log("偵測到 B 欄網址內容: " + rawFileUrls);

    var row = e.range.getRow();
    var sheet = e.range.getSheet();

    if (!rawFileUrls) {
      console.warn("B 欄沒有網址資料");
      return;
    }

    var urlList = rawFileUrls.split(",");
    var processedFileIds = [];
    var generatedGroupIds = [];

    urlList.forEach(function(rawUrl) {
      var fileUrl = rawUrl.trim();
      var fileId = "";
      
      // 使用更穩定的方式抓取 ID
      var match = fileUrl.match(/[-\w]{25,}/);
      if (match) fileId = match[0];

      if (fileId) {
        var result = processAndUpload(fileId); 
        if (result && result.groupId) {
          processedFileIds.push(fileId);
          generatedGroupIds.push(result.groupId);

          // 發送 LINE 通知
          var infoMessage = "\n✅ 健美滷味 - 新訂單通知！" +
                            "\n------------------------" +
                            "\n🏢 單位名稱: " + result.companyName + 
                            "\n📅 交貨時間: " + result.deliveryTimeStr +
                            "\n👤 聯絡人: " + result.contactName +  
                            "\n📞 電話: " + result.contactPhone;
          sendLinePush(infoMessage);
        }
      }
    });

    // 關鍵修正 2：對應你的表格欄位
    if (generatedGroupIds.length > 0) {
        // 寫入 D 欄 (第 4 欄)：FileID
        sheet.getRange(row, 4).setValue(processedFileIds.join(", ")); 
        // 寫入 E 欄 (第 5 欄)：GroupID
        sheet.getRange(row, 5).setValue(generatedGroupIds.join(", ")); 
        console.log("成功將 ID 寫入 D 欄與 E 欄");
    }
  } catch (err) {
    console.error("執行崩潰: " + err.message);
    sendLinePush("❌ 訂單處理出錯：\n" + err.message);
  }
}
/**
 * 2. 核心解析邏輯：回傳包含 GroupID, CompanyName, DeliveryTime 的物件
 */
function processAndUpload(fileId) {
  var excelFile = DriveApp.getFileById(fileId);
  var fileName = excelFile.getName();
  var orderType = fileName.indexOf('(真空)') !== -1 ? 'vacuum' : 'regular';
  var resource = { name: "temp_" + new Date().getTime(), mimeType: MimeType.GOOGLE_SHEETS };
  var tempFile = Drive.Files.create(resource, excelFile.getBlob());
  var ss = SpreadsheetApp.openById(tempFile.id);
  
  var sheet = ss.getSheets()[0];
  var rows = sheet.getDataRange().getValues();
  
  // A. 解析日期與基本資訊
  var rawDateText = rows[1][2] || rows[1][1];
  var finalDateObj = smartParseDate(rawDateText);
  // 若日期無法解析或已是過去時間，視為空值
  var importNow = new Date();
  var deliveryIsValid = finalDateObj !== null && !isNaN(finalDateObj.getTime()) && finalDateObj > importNow;
  if (!deliveryIsValid) finalDateObj = null;

  // 格式化為 LINE 顯示用的字串
  var deliveryTimeStr = deliveryIsValid
    ? Utilities.formatDate(finalDateObj, "GMT+8", "yyyy/MM/dd HH:mm")
    : "（待確認⚠️）";

  var companyName = String(rows[2][2] || rows[2][1] || "").trim();
  if (!companyName) deliveryTimeStr += "\t⚠️ 公司名稱未填";

  var groupData = {
    deliveryTime: deliveryIsValid ? finalDateObj.toISOString() : "",
    companyName: companyName,
    contactName: String(rows[3][2] || rows[3][1] || "").trim(),
    contactPhone: String(rows[4][2] || rows[4][1] || "").trim(),
    address: String(rows[5][2] || rows[5][1] || "").trim(),
    status: "pending",
    originalFileId: fileId,
    createdAt: new Date().toISOString(),
    resource: "網路",
    orderType: orderType
  };

  var groupId = createGroupOrderInFirestore(groupData);

  // --- 品項解析迴圈 (維持原有邏輯) ---
  var unitRow = rows[6];
  var nameRow = rows[7];
  var orderCount = 0;
  var totalRowIndex = -1; 
  var noteRowIndex = -1;
  for (var i = 0; i < rows.length; i++) {
    var cleanColA = String(rows[i][0] || "").replace(/\s+/g, '');
    if (cleanColA === "合計" || cleanColA === "總計") totalRowIndex = i;
    if (cleanColA.includes("備註")) noteRowIndex = i;
  }
  var endRowIndex = (totalRowIndex !== -1) ? totalRowIndex : rows.length;
  if (noteRowIndex !== -1 && noteRowIndex < endRowIndex) endRowIndex = noteRowIndex;

  for (var col = 2; col < nameRow.length; col++) {
    var rawCustomerName = String(nameRow[col] || "");
    var cleanCustomerName = rawCustomerName.replace(/\s+/g, '');
    if (!cleanCustomerName || ["合計", "總計", "姓名"].includes(cleanCustomerName)) continue;

    var personItems = [];
    var personTotal = 0;
    for (var r = 8; r < endRowIndex; r++) {
      var rawItemName = String(rows[r][0] || "");
      var cleanItemName = rawItemName.replace(/\s+/g, '');
      var unitPrice = Number(rows[r][1] || 0);
      var qty = Number(rows[r][col] || 0);

      var isComboMain = cleanItemName.includes("大綜合") || cleanItemName.includes("小綜合");
      var isContent = !isComboMain && (cleanItemName.includes("內容物") || cleanItemName.includes("包含") || rawItemName.trim().startsWith("└") || (unitPrice === 0 && cleanItemName !== ""));

      if (cleanItemName && !isContent && cleanItemName !== "素食區" && qty > 0) {
        personItems.push({
          itemName: isComboMain ? rawItemName.split('\n')[0].trim() : rawItemName.trim(),
          qty: Math.round(qty), price: unitPrice, subtotal: unitPrice * qty
        });
        personTotal += (unitPrice * qty);
      }
    }

    if (personItems.length > 0) {
      createIndividualOrderInFirestore({
        groupOrderId: groupId,
        customerName: rawCustomerName.trim(),
        customerUnit: String(unitRow[col] || "").trim(),
        items: personItems,
        totalAmount: personTotal,
        note: (noteRowIndex !== -1) ? String(rows[noteRowIndex][col] || "").trim() : "",
        createdAt: new Date().toISOString(),
        orderType: orderType
      });
      orderCount++;
    }
  }

  if (orderCount === 0) deliveryTimeStr += "\t⚠️ 無訂購品項";

  // 刪除暫存檔並回傳資料物件
  Drive.Files.remove(tempFile.id);
  return {
    groupId: groupId,
    companyName: companyName,
    deliveryTimeStr: deliveryTimeStr,
    contactName: groupData.contactName,
    contactPhone: groupData.contactPhone
  };
}

/**
 * 4. LINE 發送函式
 */
function sendLinePush(message) {
  const url = "https://api.line.me/v2/bot/message/push";
  const payload = { "to": LINE_USER_ID, "messages": [{ "type": "text", "text": message }] };
  const options = {
    "method": "post",
    "headers": { "Content-Type": "application/json", "Authorization": "Bearer " + LINE_ACCESS_TOKEN },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  UrlFetchApp.fetch(url, options);
}

// --- Firestore 傳輸函式 ---
function createGroupOrderInFirestore(data) {
  // 1. 產生 YYMMDDHHMM 格式的時間字串
  var now = new Date();
  var datePart = Utilities.formatDate(now, "Asia/Taipei", "yyMMddHHmm"); 
  
  // 2. 產生 4 碼隨機數 (補足位數至 4 位，例如 0042)
  var randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // 3. 組合最終 ID (範例: 26030816570123)
  var customDocId = datePart + randomPart;

  // 4. Firestore API URL，加上 documentId 參數
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/GroupOrders?documentId=${customDocId}`;
  
  const payload = {
    fields: {
      deliveryTime: data.deliveryTime ? { timestampValue: data.deliveryTime } : { stringValue: "" },
      companyName: { stringValue: data.companyName },
      contactName: { stringValue: data.contactName },
      contactPhone: { stringValue: data.contactPhone },
      address: { stringValue: data.address },
      status: { stringValue: data.status },
      originalFileId: { stringValue: data.originalFileId },
      createdAt: { timestampValue: data.createdAt },
      resource: { stringValue: "網路" },
      orderType: { stringValue: data.orderType || 'regular' }
    }
  };

  var res = postToFirestore(url, payload);
  
  // 回傳這個自定義的 ID 給後續程式使用
  console.log("成功建立訂單，ID: " + customDocId);
  return customDocId;
}

function createIndividualOrderInFirestore(data) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/Orders`;
  const firestoreItems = data.items.map(item => ({
    mapValue: {
      fields: {
        itemName: { stringValue: item.itemName },
        qty: { integerValue: String(item.qty) },
        price: { doubleValue: item.price },
        subtotal: { doubleValue: item.subtotal }
      }
    }
  }));
  const payload = {
    fields: {
      groupOrderId: { stringValue: data.groupOrderId },
      customerName: { stringValue: data.customerName },
      customerUnit: { stringValue: data.customerUnit || "" },
      totalAmount: { doubleValue: data.totalAmount },
      note: { stringValue: data.note },
      createdAt: { timestampValue: data.createdAt },
      orderType: { stringValue: data.orderType || 'regular' },
      items: { arrayValue: { values: firestoreItems } }
    }
  };
  postToFirestore(url, payload);
}

function postToFirestore(url, payload) {
  const options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) throw new Error("Firestore Error: " + res.getContentText());
  return res;
}

// --- 選單與刪除功能 ---
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🍱 健美滷味功能')
    .addItem('🗑️ 刪除選取行 (含雲端檔案)', 'deleteRowAndFileOnly')
    .addSeparator()
    .addItem('⚠️ 刪除所有資料 (歸零重置)', 'deleteAllData')
    .addToUi();
}

function deleteRowAndFileOnly() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var currentRow = sheet.getActiveCell().getRow();
  var ui = SpreadsheetApp.getUi();
  var fileIdString = sheet.getRange(currentRow, 3).getValue().toString();

  if (!fileIdString) {
    ui.alert('提示', 'C 欄找不到 ID，僅刪除試算表紀錄。', ui.ButtonSet.OK);
    sheet.deleteRow(currentRow);
    return;
  }

  var response = ui.alert('確認', '要刪除此行與雲端 Excel 嗎？', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    fileIdString.split(",").forEach(id => {
      try { DriveApp.getFileById(id.trim()).setTrashed(true); } catch(e) {}
    });
    sheet.deleteRow(currentRow);
  }
}

function deleteAllData() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert('🚨 極危險', '確定要清空所有資料嗎？', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    // 取得 C 欄檔案並刪除
    sheet.getRange(2, 3, lastRow - 1, 1).getValues().forEach(row => {
      String(row[0]).split(",").forEach(id => {
        try { DriveApp.getFileById(id.trim()).setTrashed(true); } catch(e) {}
      });
    });
    sheet.deleteRows(2, lastRow - 1);
  }
  ui.alert('完成', '試算表與雲端檔案已清理。', ui.ButtonSet.OK);
}

/**
 * 自動清理舊資料 (建議設定每日執行一次)
 */
function autoCleanupRoutine() {
  const DAYS_TO_KEEP = 30; // 設定要保留的天數
  const thresholdTime = new Date();
  thresholdTime.setDate(thresholdTime.getDate() - DAYS_TO_KEEP);
  
  console.log("開始清理 " + thresholdTime.toISOString() + " 之前的舊資料...");

  // 1. 從 Firestore 取得所有訂單 (這裡用簡單的 List 方法)
  // 注意：若資料量極大，建議改用 runQuery 進行過濾
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/GroupOrders`;
  const options = {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  
  const res = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(res.getContentText());

  if (!data.documents) {
    console.log("沒有找到任何訂單紀錄。");
    return;
  }

  data.documents.forEach(doc => {
    const fields = doc.fields;
    const createdAt = new Date(fields.createdAt.timestampValue);
    const docId = doc.name.split('/').pop();
    const fileId = fields.originalFileId ? fields.originalFileId.stringValue : null;

    // 2. 比對時間
    if (createdAt < thresholdTime) {
      console.log("正在清理過期訂單: " + docId);

      // A. 刪除 Google Drive 檔案 (移至垃圾桶)
      if (fileId) {
        try {
          DriveApp.getFileById(fileId).setTrashed(true);
          console.log("  - 雲端檔案已移至垃圾桶");
        } catch (e) {
          console.warn("  - 找不到檔案或無權限: " + fileId);
        }
      }

      // B. 刪除 Firestore 中的 GroupOrder
      deleteFirestoreDoc(`GroupOrders/${docId}`);

      // C. (進階) 這裡建議也要刪除關連的個別訂單 Orders
      // 為了簡化，此處僅示範刪除母單，子單可透過 Firestore TTL 或額外查詢刪除
    }
  });
}

/**
 * 刪除 Firestore 指定路徑的文件
 */
function deleteFirestoreDoc(path) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  UrlFetchApp.fetch(url, {
    method: "delete",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  console.log("  - Firestore 紀錄已刪除: " + path);
}

/**
 * 終極全語義解析器：支援「這禮拜五」、「下週一」、軍事時間 1800、民國年及相對日期
 */
function smartParseDate(input) {
  if (input instanceof Date) return input;
  if (!input) return null;

  var now = new Date();
  var str = String(input).trim()
    .replace(/[\uff01-\uff5e]/g, function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xfee0); }) // 全形轉半形
    .toLowerCase();

  // 1. 基礎日期設定
  var targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 2. 處理相對日期：今天、明天、後天
  if (str.includes("明天")) targetDate.setDate(targetDate.getDate() + 1);
  else if (str.includes("後天")) targetDate.setDate(targetDate.getDate() + 2);
  else if (str.includes("大後天")) targetDate.setDate(targetDate.getDate() + 3);

  // 3. 處理「這禮拜/下禮拜/週」的邏輯
  var weekdayMap = { "一": 1, "1": 1, "二": 2, "2": 2, "三": 3, "3": 3, "四": 4, "4": 4, "五": 5, "5": 5, "六": 6, "6": 6, "日": 0, "天": 0, "7": 0 };
  var weekMatch = str.match(/(這禮拜|本週|下禮拜|下週|週|禮拜|星期)([一二三四五六日天1234567])/);
  
  if (weekMatch) {
    var isNextWeek = /下禮拜|下週/.test(weekMatch[1]);
    var targetDay = weekdayMap[weekMatch[2]];
    var currentDay = now.getDay(); // 0 是週日, 1-6 是週一至六
    
    // 計算到目標星期的天數差
    var diff = targetDay - currentDay;
    if (isNextWeek) {
      diff += 7;
    } else if (diff < 0) {
      // 如果說「這禮拜二」但今天已經是週四，通常指下週二或不做更動，這裡預設為下一個週二
      diff += 7;
    }
    targetDate.setDate(targetDate.getDate() + diff);
  }

  // 4. 提取數字序列 (處理 2026/03/20 或 1800)
  var nums = str.match(/\d+/g);
  var hour = 0, min = 0;

  if (nums) {
    // 判斷是否含有具體的年月日數字 (例如 2026/03/20)
    if (nums.length >= 3 && nums[0].length >= 2) {
      var year = parseInt(nums[0]);
      if (year < 200) year += 1911; // 民國年
      targetDate.setFullYear(year);
      targetDate.setMonth(parseInt(nums[1]) - 1);
      targetDate.setDate(parseInt(nums[2]));
      
      // 處理後續的時間數字 (如 1800 或 18 00)
      if (nums[3]) {
        if (nums[3].length === 4) {
          hour = parseInt(nums[3].substring(0, 2));
          min = parseInt(nums[3].substring(2, 4));
        } else {
          hour = parseInt(nums[3]);
          min = parseInt(nums[4] || 0);
        }
      }
    } else {
      // 只有時間數字 (如 在「這禮拜五」之後出現的 1800)
      var timePart = nums.find(n => n.length === 4 || n.length === 1 || n.length === 2);
      if (timePart) {
        if (timePart.length === 4) {
          hour = parseInt(timePart.substring(0, 2));
          min = parseInt(timePart.substring(2, 4));
        } else {
          hour = parseInt(nums[0]);
          min = parseInt(nums[1] || 0);
        }
      }
    }
  }

  // 5. 處理上下午語意校正
  var isPM = /下午|晚上|中午|pm/i.test(str);
  if (isPM && hour < 12) hour += 12;
  if (!isPM && /上午|凌晨|am/i.test(str) && hour === 12) hour = 0;

  targetDate.setHours(hour, min, 0, 0);

  if (isNaN(targetDate.getTime())) return null;
  return targetDate;
}