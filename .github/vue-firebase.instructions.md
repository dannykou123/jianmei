---
applyTo: "**/*.{vue,js,html,css,json}"
---

# Vue Firebase Frontend Instructions

- Use Vue 3 Composition API with `<script setup>`.
- Use Firebase modular Web SDK.
- Keep Firebase initialization in `src/firebase/index.js`.
- Keep Firestore/Auth/Storage operations in `src/services/` or `src/composables/`.
- Do not hardcode Firebase secrets or service account credentials.
- Use Vite environment variables with `VITE_` prefix.
- Preserve existing plain HTML behavior during migration.
- Prefer incremental migration over full rewrite.
- Always handle loading, error, and empty states.
- Avoid `v-html` unless content is sanitized.
- Do not add Vue Router, Pinia, TypeScript, or UI frameworks unless explicitly requested.