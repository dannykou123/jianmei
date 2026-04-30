# Copilot Instructions

## Project Context

This project is a frontend web application.

Current implementation may include:

- Plain HTML
- CSS
- Vanilla JavaScript
- Firebase integration

The project is being migrated gradually to:

- Vue 3
- Vite
- Firebase Web SDK

Copilot should help with incremental migration, not a full rewrite unless explicitly requested.

---

## Language and Communication

- 回覆請優先使用繁體中文。
- 程式碼註解可以使用繁體中文或英文，但請保持同一檔案內一致。
- 說明修改時，請包含：
  - 修改目的
  - 修改檔案
  - 影響範圍
  - 測試方式
- 不要只貼程式碼而不說明原因。
- 若需求不明確，先根據現有專案結構做最小合理假設，不要直接重構整個專案。

---

## Migration Strategy

When migrating from plain HTML/JavaScript to Vue:

- Prefer incremental migration.
- Do not rewrite the whole application unless the user explicitly asks.
- Preserve existing UI behavior.
- Preserve existing Firebase behavior.
- Keep existing routes, DOM IDs, CSS class names, and data attributes when they are used by existing scripts or styles.
- Avoid breaking existing static hosting deployment.
- If a feature is currently working, do not replace it with a more complex solution without clear benefit.
- If moving logic into Vue components, keep the original business logic equivalent.

Recommended migration path:

1. Identify the current HTML structure and JavaScript behavior.
2. Extract repeated UI sections into Vue components.
3. Move state and event handling into Vue reactive state.
4. Move Firebase initialization into a dedicated module.
5. Move Firebase queries and writes into service modules.
6. Keep deployment simple and compatible with Firebase Hosting or static hosting.

---

## Vue Rules

Use Vue 3 with Composition API by default.

Preferred style:

- Use `<script setup>`.
- Use `ref`, `reactive`, `computed`, `watch`, and lifecycle hooks appropriately.
- Keep components small and focused.
- Use props and emits instead of directly mutating parent state.
- Avoid unnecessary global state.
- Only introduce Pinia if state is shared across many unrelated components.
- Only introduce Vue Router if the app has multiple pages or needs URL-based navigation.
- Avoid Options API unless modifying an existing Options API component.

Component rules:

- Component names should use PascalCase.
- File names should use PascalCase for components, for example:
  - `OrderForm.vue`
  - `LoginPanel.vue`
  - `ProductList.vue`
- Shared composables should be placed under:
  - `src/composables/`
- Firebase service modules should be placed under:
  - `src/services/`
  - `src/firebase/`
- Do not place Firebase calls directly inside many components if the logic can be reused.

Suggested structure:

```text
src/
  main.js
  App.vue
  components/
  pages/
  composables/
  services/
  firebase/
  assets/