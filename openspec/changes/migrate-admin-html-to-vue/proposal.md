## Why

`/admin.html` 是一份 CDN-based 單一 HTML 檔，包含所有業務邏輯、樣式與 Firebase 呼叫。Vue 3 版後台 (`/admin`) 已有基本架構，但上次遷移未完成，缺少 admin.html 的關鍵功能，導致管理員仍依賴 admin.html 操作。本次要補齊所有功能缺口，讓 `/admin` 完全取代 `/admin.html`，並對舊路徑建立 redirect。

## What Changes

- 在 `AdminDetails.vue` 補上 **NAS 遠端列印**（出貨單 `printGroupViaNas`、備貨單 `printStockViaNas`、單筆客戶出貨單 `printCustomerViaNas`）
- 在 `AdminDetails.vue` 補上 **批次選取並列印**（checkbox 多選 + batchExportLabels / batchExportStock）
- 在 `AdminDetails.vue` 補上 **手動新增訂單** Modal（包含新增客戶明細、品項、enrichItemsWithPrice）
- 在 `AdminDetails.vue` 補上 **訂單詳細 Modal** 三個 Tab（基本資訊、客戶訂單、備料統計）及行內編輯
- 在 `AdminDetails.vue` 補上 **分頁載入**（Firestore pagination，目前 Vue 版一次全撈）
- 提取 NAS 列印邏輯為 `src/services/nasPrint.service.js` 共用
- 在 `firebase.json` 新增 **redirect**：`/admin.html` → `/admin`（`301`）以保留書籤相容

## Capabilities

### New Capabilities

- `admin-nas-printing`: NAS 遠端列印服務整合，支援出貨單（75×100mm label）、備貨單（stock ticket）、批次與單筆模式
- `admin-manual-order-creation`: 後台手動建立已接單 GroupOrder，含新增多位客戶與品項明細
- `admin-order-detail-tabs`: 訂單詳細 Modal 三 Tab 檢視與行內編輯（基本資訊、客戶訂單、備料統計）
- `admin-batch-selection`: 訂單列表批次 checkbox 選取，搭配批次列印與批次操作工具列

### Modified Capabilities

## Impact

- **修改**: `src/pages/admin/AdminDetails.vue`（主要工作量）
- **新增**: `src/services/nasPrint.service.js`
- **修改**: `firebase.json`（新增 /admin.html redirect）
- **不影響**: 其他頁面、Firebase 資料結構、auth 流程、glass.css 設計系統
