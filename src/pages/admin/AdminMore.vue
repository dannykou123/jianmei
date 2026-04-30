<script setup>
import { useRouter } from 'vue-router';
import { useAdminAuth } from '@/stores/useAdminAuth';

const router = useRouter();
const auth = useAdminAuth();

const items = [
  { key: 'items', label: '商品管理', icon: 'fas fa-box', adminOnly: true, route: '/admin/items' },
  { key: 'accounts', label: '帳號管理', icon: 'fas fa-users', adminOnly: true, route: '/admin/accounts' },
  { key: 'analytics', label: '統計分析', icon: 'fas fa-chart-line', adminOnly: true, route: '/admin/analytics' },
];
</script>

<template>
  <section>
    <h2 class="text-xl font-bold mb-4">更多功能</h2>
    <div class="more-grid">
      <button v-for="it in items" :key="it.key"
              class="more-grid-item"
              :disabled="it.adminOnly && !auth.isAdmin"
              :class="{ 'opacity-40 cursor-not-allowed': it.adminOnly && !auth.isAdmin }"
              @click="router.push(it.route)">
        <i :class="it.icon"></i>
        <span>{{ it.label }}</span>
      </button>
    </div>
  </section>
</template>
