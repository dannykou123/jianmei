## ADDED Requirements

### Requirement: 訂單列表 checkbox 多選
系統 SHALL 在訂單列表每列左側顯示 checkbox，允許管理員同時選取多筆訂單。

#### Scenario: 選取單筆
- **WHEN** 管理員勾選某訂單的 checkbox
- **THEN** 該筆訂單加入選取集合，列表顯示選取樣式（背景色變化）

#### Scenario: 取消選取
- **WHEN** 管理員再次點擊已選取訂單的 checkbox
- **THEN** 該筆從選取集合移除

#### Scenario: 全選 / 取消全選
- **WHEN** 管理員點擊列表標頭的全選 checkbox
- **THEN** 切換所有目前可見（filtered）訂單的選取狀態：若尚有未選取則全選，若全部已選取則全部取消

---

### Requirement: 批次選取後顯示操作工具列
系統 SHALL 在有選取項目時，於頁面顯著位置（頂部或列表上方）顯示批次操作工具列，顯示選取數量、「批次列印備貨單」與「批次列印出貨單」按鈕。

#### Scenario: 工具列顯示
- **WHEN** selectedIds.size > 0
- **THEN** 顯示工具列，文字「已選取 N 筆」，以及「備貨單」和「出貨單 (N)」按鈕

#### Scenario: 工具列隱藏
- **WHEN** selectedIds.size === 0
- **THEN** 工具列不顯示

---

### Requirement: 批次 NAS 列印出貨單
系統 SHALL 允許管理員對所有選取的訂單批次傳送出貨單列印指令至 NAS，不逐筆預覽，直接列印。

#### Scenario: 批次列印出貨單
- **WHEN** 管理員點擊工具列的「出貨單 (N)」按鈕
- **THEN** 系統逐筆呼叫 `printGroupViaNas` 的列印（跳過預覽），全部傳送後顯示成功 / 失敗摘要 toast

---

### Requirement: 批次 NAS 列印備貨單
系統 SHALL 允許管理員對所有選取的訂單批次傳送備貨單列印指令至 NAS，逐筆各自產生一份備貨統計。

#### Scenario: 批次列印備貨單
- **WHEN** 管理員點擊工具列的「備貨單」按鈕
- **THEN** 系統逐筆呼叫 `printStockViaNas` 的列印（跳過預覽），全部傳送後顯示結果 toast
