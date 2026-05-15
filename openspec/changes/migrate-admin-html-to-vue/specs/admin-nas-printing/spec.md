## ADDED Requirements

### Requirement: NAS 列印出貨單（整個團單）
系統 SHALL 允許管理員對一筆 GroupOrder 發起「出貨單」NAS 列印，對每位客戶各產生一張 75×100mm 標籤頁，並在列印前顯示預覽 Modal。

#### Scenario: 點擊出貨單列印按鈕
- **WHEN** 管理員點擊訂單列的「出貨單」按鈕
- **THEN** 系統向 `POST ${NAS_API_BASE}/api/preview-image?page=1` 取得第 1 位客戶的預覽圖，並顯示 NAS 預覽 Modal，Modal 標題顯示該公司名稱，副標題顯示共幾個標籤

#### Scenario: 多人切換預覽
- **WHEN** 預覽 Modal 開啟且有多位客戶時，管理員點擊「←」或「→」箭頭
- **THEN** 系統重新呼叫預覽 API，換成對應客戶的圖片

#### Scenario: 確認列印
- **WHEN** 管理員點擊 Modal 的「確認列印」按鈕
- **THEN** 系統依序呼叫 `POST ${NAS_API_BASE}/api/print-label`（每位客戶各一次），完成後顯示成功或失敗筆數的 toast

#### Scenario: 列印中防重複
- **WHEN** 列印進行中（nasPrintingId 設為該 groupOrder.id）
- **THEN** 該行的出貨單按鈕顯示 disabled 狀態

---

### Requirement: NAS 列印備貨單（整個團單）
系統 SHALL 允許管理員對一筆 GroupOrder 發起「備貨單」NAS 列印，將彙整後的品項統計傳送到 `POST ${NAS_API_BASE}/api/print-stock`，並在列印前顯示預覽圖。

#### Scenario: 點擊備貨單列印按鈕
- **WHEN** 管理員點擊訂單列的「備貨單」按鈕
- **THEN** 系統撈取該團單所有客戶訂單，彙整品項數量，呼叫 `POST ${NAS_API_BASE}/api/preview-stock?page=1` 取得預覽，顯示預覽 Modal

#### Scenario: 確認列印備貨單
- **WHEN** 管理員點擊 Modal 的「確認列印」按鈕
- **THEN** 系統呼叫 `POST ${NAS_API_BASE}/api/print-stock`，成功後顯示 toast

---

### Requirement: NAS 列印單筆客戶出貨單
系統 SHALL 允許管理員在訂單詳細 Modal 的「客戶訂單」Tab 中，對單一客戶訂單列印出貨單。

#### Scenario: 單筆出貨單列印
- **WHEN** 管理員點擊客戶訂單列的「出貨單」按鈕
- **THEN** 系統組成該客戶的 label payload，呼叫預覽 API，顯示含確認按鈕的預覽 Modal

---

### Requirement: NAS 預覽 Modal 分頁
系統 SHALL 在預覽 Modal 中支援多頁出貨單（X-Total-Pages header > 1）的上下頁切換。

#### Scenario: 分頁顯示
- **WHEN** NAS API 回傳 `X-Total-Pages: 2` 以上
- **THEN** Modal 顯示「第 N / M 頁」及上下頁按鈕

#### Scenario: 切換頁面
- **WHEN** 管理員點擊「下一頁」
- **THEN** 系統重新呼叫預覽 API 帶對應 page 參數，並更新預覽圖
