## Context

`/admin.html` 是一份 5000+ 行的 CDN Vue 3（`createApp`）單檔應用，Firebase SDK 直接由 CDN 載入。`src/pages/admin/` 已有 Vue 3 SPA 版本，但上次遷移未完成，遺漏了以下功能：

1. **NAS 遠端列印**（出貨單、備貨單）— 與 `https://dannykuo123.synology.me` API 整合，含預覽 Modal
2. **訂單列表批次選取**（checkbox + 批次列印工具列）
3. **手動建立訂單 Modal**（管理員後台直接開單，狀態直接為 `approved`）
4. **訂單詳細 Modal 三 Tab**（基本資訊 + 行內編輯、客戶訂單明細 + 單筆列印、備料統計）

目前 `AdminDetails.vue` 只有單層詳細 Modal 與基本列印（開新視窗），缺少上述所有進階功能。

## Goals / Non-Goals

**Goals:**
- 在 Vue SPA 補齊 admin.html 所有遺漏功能，使管理員能完全離開 admin.html
- 提取 NAS 列印邏輯為可重用 service (`nasPrint.service.js`)
- 保持現有 `glass.css` 設計系統、CSS class 名稱、UI 外觀完全一致
- 在 `firebase.json` 加 `/admin.html` → `/admin` 的 301 redirect 保留書籤相容性

**Non-Goals:**
- 不重寫其他頁面（Review、Items、Accounts、Contacts、Analytics、More）
- 不改變 Firestore 資料結構
- 不引入新的 npm 依賴（NAS 呼叫直接用原生 `fetch`，不需 jsPDF/html2canvas）
- 不連動 LINE 通知功能

## Decisions

### 決策 1：NAS 列印邏輯提取為 service

**選擇**：新增 `src/services/nasPrint.service.js`，匯出 `buildLabelPayload(order, groupOrder)`、`buildStockPayload(groupOrder, expandedItems)` 等純函式。

**原因**：admin.html 的 NAS 邏輯混在 Vue setup() 裡，難以維護。提取成 service 後，各頁面 import 使用，且便於測試。NAS_API_BASE 定為 module-level 常數（`https://dannykuo123.synology.me`），未來可改為 `import.meta.env.VITE_NAS_API_BASE`。

**棄選**：直接 inline 在 AdminDetails.vue — 保留了 1:1 可比對性，但違反 DRY，未來 AdminReview 若需列印也要重複。

### 決策 2：NAS 預覽 Modal 以 composable 封裝

**選擇**：新增 `src/composables/useNasPreview.js`，封裝 `nasPreview` state、`nasPreviewClose()`、`nasChangePage()`、`nasChangePerson()`，並在 `AdminDetails.vue` import。

**原因**：預覽 Modal 狀態複雜（show、imgUrl、payload、payloads、personIdx、page、totalPages、loading、confirmFn），封裝後 AdminDetails.vue 不會因 NAS 相關 state 過度膨脹。

### 決策 3：批次選取使用 `Set<string>` ref

**選擇**：`const selectedIds = ref(new Set())` + `toggleSelect(id)` / `selectAll()` / `clearSelect()` 方法。計算 `isAllSelected computed`。

**原因**：與 admin.html 行為一致，選取後工具列才顯示批次列印按鈕。使用 Set 避免重複選取。

### 決策 4：訂單詳細 Modal 保持三 Tab 結構

**選擇**：在 `GlassModal` 內以 `detailTab ref('info' | 'orders' | 'stock')` 控制三個 Tab panel。

**原因**：admin.html 的詳細 Modal 分三個 Tab（基本資訊、客戶訂單、備料統計），使用者已習慣。Vue 版只要對齊即可，無需重設計 UX。

### 決策 5：手動建立訂單 Modal 中品項邏輯

**選擇**：從 `AdminItems` service 取得品項清單，並複用 `enrichItemsWithPrice(items, orderType)` 邏輯（由 admin.html 移植）。

**原因**：價格計算邏輯與現有系統一致，避免雙重維護。

## Risks / Trade-offs

- **CORS：NAS API** 需允許 Vue SPA 的 origin（`https://jianmei-*.web.app`）。若 NAS 端未設定，列印會失敗。
  → 緩解：部署後立即測試 NAS 呼叫；若失敗需在 NAS 端補 CORS header。

- **AdminDetails.vue 複雜度增加**：補上所有功能後該檔案會變大（預估 600–900 行）。
  → 緩解：NAS logic 放 service/composable，Modal template 保持語意清晰。

- **分頁行為微差異**：admin.html 使用 Firestore cursor pagination（`startAfter`），Vue 版目前一次全撈。補上分頁以保持一致行為，但一次全撈功能依然正確，只是在資料量大時較慢。
  → 緩解：本次仍使用一次全撈（與現有 Vue 版一致），與 admin.html 行為略有差異但不影響使用，分頁可列為後續優化。

## Migration Plan

1. 新增 `nasPrint.service.js` 與 `useNasPreview.js`
2. 修改 `AdminDetails.vue`，補齊四大缺口
3. 修改 `firebase.json`，加入 `/admin.html` redirect
4. 本機 `vite dev` 驗證所有 Tab、Modal、列印流程
5. `firebase deploy` 部署
6. 登入 `/admin` 試行完整操作
7. 確認 `/admin.html` redirect 正常跳轉後，保留 `public/admin.html` 但移除 Firebase Hosting 的直接服務（交由 redirect 規則）
