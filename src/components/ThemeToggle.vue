<script setup>
import { useTheme } from '@/composables/useTheme';

const { isDark, toggle } = useTheme();
</script>

<template>
  <button
    type="button"
    class="g-btn g-btn-glass g-btn-sm theme-toggle-btn"
    :class="{ 'is-dark': isDark }"
    :title="isDark ? '切換淺色模式' : '切換深色模式'"
    @click="toggle"
  >
    <i :class="isDark ? 'fas fa-moon' : 'fas fa-sun'"></i>
  </button>
</template>
