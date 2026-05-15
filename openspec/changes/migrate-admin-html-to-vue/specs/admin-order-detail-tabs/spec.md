## ADDED Requirements

### Requirement: 訂單詳細 Modal 三 Tab 結構
系統 SHALL 將訂單詳細 Modal 分為三個 Tab：「基本資訊」（info）、「客戶訂單」（orders）、「備料統計」（stock），取代現有的單一 Tab Modal。

#### Scenario: 開啟詳細 Modal 預設顯示基本資訊
- **WHEN** 管理員點擊訂單列進入詳細
- **THEN** Modal 開啟並預設停在「基本資訊」Tab

#### Scenario: 切換 Tab
- **WHEN** 管理員點擊任一 Tab 按鈕
- **THEN** 對應 Tab 的內容顯示，其他 Tab 隱藏

---

### Requirement: 基本資訊 Tab 行內編輯
系統 SHALL 允許管理員在「基本資訊」Tab 中直接編輯 GroupOrder 的公司名稱、聯絡人、電話、配送地址、配送時間、訂購類型，並儲存至 Firestore。

#### Scenario: 點擊編輯按鈕
- **WHEN** 管理員點擊基本資訊 Tab 的「編輯」按鈕
- **THEN** 所有欄位切換為 input 可編輯模式

#### Scenario: 儲存基本資訊
- **WHEN** 管理員點擊「儲存」
- **THEN** 系統呼叫 `updateGroupOrder`，成功後顯示 toast，欄位回到顯示模式，列表中對應資料同步更新

#### Scenario: 取消編輯
- **WHEN** 管理員點擊「取消」
- **THEN** 欄位恢復原始值，回到顯示模式，不寫入 Firestore

---

### Requirement: 客戶訂單 Tab 顯示與列印
系統 SHALL 在「客戶訂單」Tab 列出所有 Orders 資料，每筆顯示客戶姓名、單位、品項清單、合計金額，並提供 NAS 出貨單列印按鈕。

#### Scenario: 顯示客戶訂單列表
- **WHEN** 管理員切換至「客戶訂單」Tab
- **THEN** 列出此 GroupOrder 的所有客戶訂單，依客戶姓名排序

#### Scenario: 單筆 NAS 出貨單列印
- **WHEN** 管理員點擊某客戶訂單的「出貨單」按鈕
- **THEN** 呼叫 `printCustomerViaNas`，顯示預覽 Modal

---

### Requirement: 備料統計 Tab
系統 SHALL 在「備料統計」Tab 彙整此 GroupOrder 下所有品項數量（展開子品項），以清單或表格顯示，並提供 NAS 備貨單列印按鈕。

#### Scenario: 顯示備料統計
- **WHEN** 管理員切換至「備料統計」Tab
- **THEN** 系統彙整所有客戶訂單品項，展開子品項（expandStockItems），以品項名稱 + 數量的清單顯示

#### Scenario: 列印備料統計
- **WHEN** 管理員點擊「列印備貨統計」
- **THEN** 呼叫 `printStockViaNas`，顯示預覽 Modal
