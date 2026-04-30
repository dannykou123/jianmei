<script setup>
// 根路徑中性提示頁：依使用者要求「不可由同一入口登入」，不放任何跨入口導覽按鈕
import ThemeToggle from '@/components/ThemeToggle.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 text-center">
    <div class="absolute top-4 right-4"><ThemeToggle /></div>
    <div class="g-card-solid max-w-md w-full p-8 animate-zoom-in">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
           style="background: linear-gradient(135deg, #B0736A, #C29185); color:#fff;">
        <i class="fas fa-utensils text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary)">健美滷味</h1>
      <p class="text-sm mb-6" style="color: var(--text-secondary)">
        本系統共有三個入口，請使用對應網址進入。
      </p>
      <ul class="text-left text-sm space-y-2" style="color: var(--text-secondary)">
        <li><i class="fas fa-store mr-2"></i>店家後台：<a href="admin.html" class="underline"><code class="px-1">admin.html</code></a></li>
        <li><i class="fas fa-people-group mr-2"></i>團購人：<code class="px-1">/organizer</code></li>
        <li><i class="fas fa-cart-shopping mr-2"></i>訂購人：<code class="px-1">/order/:開團編號</code></li>
      </ul>
    </div>
  </div>
</template>
