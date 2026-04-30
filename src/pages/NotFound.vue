<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 text-center">
    <div class="g-card-solid max-w-md w-full p-8 animate-zoom-in">
      <i class="fas fa-circle-question text-5xl mb-3 text-amber-600"></i>
      <h1 class="text-2xl font-bold mb-2">找不到頁面</h1>
      <p class="text-sm mb-6" style="color: var(--text-secondary)">
        您所造訪的網址不存在或已失效。
      </p>
      <button class="g-btn g-btn-primary" @click="router.replace('/')">回首頁</button>
    </div>
  </div>
</template>
