## 1. 基礎 Service / Composable 建立

- [ ] 1.1 新增 `src/services/nasPrint.service.js`，匯出 `NAS_API_BASE` 常數、`buildLabelPayload(order, groupOrder, priceMap)` 與 `buildStockPayload(groupOrder, expandedItems)` 純函式
- [ ] 1.2 新增 `src/composables/useNasPreview.js`，封裝 `nasPreview` state（show、imgUrl、title、subtitle、loading、confirmFn、page、totalPages、pageLoading、payload、payloads、personIdx、previewEndpoint、printEndpoint）
- [ ] 1.3 在 `useNasPreview.js` 實作 `nasPreviewClose()`、`nasChangePage(delta)`、`nasChangePerson(delta)` 方法
- [ ] 1.4 在 `useNasPreview.js` 實作 `openGroupLabelPreview(groupOrder, orders, priceMap, onPrint)` 與 `openStockPreview(groupOrder, expandedItems, onPrint)` 輔助函式

## 2. AdminDetails.vue — NAS 列印功能

- [ ] 2.1 在 `AdminDetails.vue` import `useNasPreview`、`nasPrint.service`
- [ ] 2.2 新增 `nasPrintingId ref`、`priceMap ref`，實作 `_fetchSubOrdersWithPrices(groupOrder)` 取得子訂單並補上價格
- [ ] 2.3 實作 `printGroupViaNas(groupOrder)`：撈子訂單 → 組 payloads → 呼叫預覽 API → openGroupLabelPreview
- [ ] 2.4 實作 `printStockViaNas(groupOrder)`：撈子訂單 → 彙整品項 → expandStockItems → 呼叫備貨預覽 API → openStockPreview
- [ ] 2.5 在訂單列表每列加入「出貨單」與「備貨單」按鈕（g-btn-success-solid、g-btn-info），disabled 判斷 nasPrintingId
- [ ] 2.6 在 template 加入 NAS 預覽 Modal（使用現有 GlassModal 或 inline 實作），顯示預覽圖片、分頁、多人切換、確認／取消按鈕

## 3. AdminDetails.vue — 批次選取

- [ ] 3.1 新增 `selectedIds ref(new Set())`，實作 `toggleSelect(id)`、`selectAll()`、`clearSelect()`
- [ ] 3.2 計算 `isAllSelected computed`（filtered 全部被選時為 true）
- [ ] 3.3 在列表 table 標頭加入全選 checkbox
- [ ] 3.4 在每列左側加入單筆 checkbox，綁定 `toggleSelect(g.id)`
- [ ] 3.5 實作批次工具列（v-if selectedIds.size > 0），顯示「已選取 N 筆」、「備貨單」、「出貨單 (N)」按鈕
- [ ] 3.6 實作 `batchExportLabels()`：逐筆對選取訂單呼叫 NAS print-label（直接列印，不預覽），完成後 toast 摘要
- [ ] 3.7 實作 `batchExportStock()`：逐筆對選取訂單呼叫 NAS print-stock（直接列印，不預覽），完成後 toast 摘要

## 4. AdminDetails.vue — 訂單詳細三 Tab Modal

- [ ] 4.1 重構 `openDetail` 函式：保留三 Tab 狀態 `detailTab ref('info')`，開啟時撈子訂單
- [ ] 4.2 實作「基本資訊」Tab 顯示模式，列出 companyName、contactName、contactPhone、address、deliveryTime、orderType、status
- [ ] 4.3 實作「基本資訊」Tab 行內編輯模式（`detailInfoEditing ref`），按「編輯」切換，儲存呼叫 `updateGroupOrder`
- [ ] 4.4 實作「客戶訂單」Tab，列出子訂單（姓名、單位、品項、合計），每列加「出貨單」NAS 列印按鈕
- [ ] 4.5 在「客戶訂單」Tab 實作 `printCustomerViaNas(customerOrder)`：組 single payload → 呼叫預覽 → openGroupLabelPreview
- [ ] 4.6 實作「備料統計」Tab，彙整品項後以清單顯示，加「列印備貨統計」按鈕（呼叫 printStockViaNas）
- [ ] 4.7 在 Modal 頂部加入三 Tab 切換按鈕列（is-active 樣式套用現有 button classes）
- [ ] 4.8 在 Modal 頂部新增「列印全部出貨單」按鈕（呼叫 printGroupViaNas）

## 5. AdminDetails.vue — 手動建立訂單

- [ ] 5.1 在頁面加入「新增訂單」按鈕（admin 角色才顯示）
- [ ] 5.2 建立 `createOrderModal ref`（show、form 欄位 ref）
- [ ] 5.3 實作建立訂單 Modal：公司名稱、聯絡人、電話、地址、配送時間、來源、訂購類型欄位
- [ ] 5.4 實作「新增訂購人」動態列：客戶姓名、單位、品項（品名下拉 + 數量 input）
- [ ] 5.5 實作 `enrichItemsWithPrice(items, orderType)` 函式，從 priceMap 計算小計
- [ ] 5.6 實作 `saveCreateGroupOrder()`：驗證 → setDoc GroupOrder（id 格式 YYMMDDHHMM + 2碼隨機）→ addDoc Orders → updateDoc totalAmount → toast 成功 → reload
- [ ] 5.7 品項名稱欄位加入 `<datalist>` 提供品項自動完成

## 6. firebase.json redirect

- [ ] 6.1 在 `firebase.json` 的 `hosting.redirects` 陣列新增 `{ "source": "/admin.html", "destination": "/admin", "type": 301 }`

## 7. 驗收測試

- [ ] 7.1 `npm run dev` 本機開啟 `/admin`，確認 NAS 預覽 Modal 顯示出貨單預覽圖
- [ ] 7.2 確認批次選取工具列在選取訂單後才顯示
- [ ] 7.3 確認訂單詳細 Modal 三 Tab 正常切換，基本資訊行內編輯可儲存
- [ ] 7.4 確認手動建立訂單 Modal 可正常建立並出現在列表
- [ ] 7.5 `firebase deploy`，在 production 重複上述測試
- [ ] 7.6 訪問 `/admin.html`，確認 301 redirect 至 `/admin`
