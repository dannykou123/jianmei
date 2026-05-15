## ADDED Requirements

### Requirement: 手動建立已接單訂單
系統 SHALL 允許 admin 角色管理員在訂單管理頁面手動建立一筆 GroupOrder，狀態直接設為 `approved`，無需等待審核流程。

#### Scenario: 開啟建立訂單 Modal
- **WHEN** 管理員點擊「新增訂單」按鈕
- **THEN** 顯示建立訂單 Modal，包含：公司名稱、聯絡人、電話、配送地址、配送時間、來源（resource）、訂購類型（regular / vacuum）欄位

#### Scenario: 表單驗證失敗
- **WHEN** 管理員送出表單但必填欄位（公司名稱、聯絡人、電話、配送時間、配送地址、來源）為空，或配送時間早於現在
- **THEN** 顯示對應錯誤提示，不建立資料

#### Scenario: 新增客戶明細
- **WHEN** 管理員在 Modal 中點擊「新增訂購人」
- **THEN** 出現一列可輸入客戶姓名、單位、品項（品名 + 數量）的表單行

#### Scenario: 儲存訂單
- **WHEN** 表單驗證通過且至少有一位客戶，管理員點擊「儲存」
- **THEN** 系統建立 GroupOrder（status: 'approved'）及對應 Orders 子文件，計算 totalAmount，顯示成功 toast，關閉 Modal 並重新載入列表

#### Scenario: 品項計算
- **WHEN** 管理員輸入品項名稱與數量
- **THEN** 系統從品項清單取得單價，即時計算小計，最終 totalAmount 為所有客戶訂單加總

---

### Requirement: 品項自動完成輸入
系統 SHALL 在手動建立訂單的品項欄位提供品項清單下拉選單，讓管理員選取已知品項名稱。

#### Scenario: 品項選取
- **WHEN** 管理員點擊品名輸入框
- **THEN** 顯示可用品項名稱列表（來自 fetchAdminItems）供選取
