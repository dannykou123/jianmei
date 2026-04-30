<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminAuth } from '@/stores/useAdminAuth';
import { subscribeGroupOrders } from '@/services/orders.service';
import ThemeToggle from '@/components/ThemeToggle.vue';
import BottomTabBar from '@/components/BottomTabBar.vue';

const auth = useAdminAuth();
const route = useRoute();
const router = useRouter();

const pendingCount = ref(0);
let unsub = null;

onMounted(() => {
  unsub = subscribeGroupOrders((list) => {
    pendingCount.value = list.length;
  }, { status: 'pending' });
});

const tabs = computed(() => {
  const base = [
    { key: 'review', label: '待審核', icon: 'fas fa-clock', badge: pendingCount.value, route: '/admin/review' },
    { key: 'details', label: '訂單', icon: 'fas fa-list-check', route: '/admin/details' },
    { key: 'contacts', label: '聯絡人', icon: 'fas fa-address-book', route: '/admin/contacts' },
    { key: 'more', label: '更多', icon: 'fas fa-ellipsis', route: '/admin/more' },
  ];
  return base;
});

const currentTab = computed({
  get: () => {
    const seg = route.path.split('/')[2] || 'review';
    if (['items', 'accounts', 'analytics'].includes(seg)) return 'more';
    return seg;
  },
  set: (key) => {
    const t = tabs.value.find((x) => x.key === key);
    if (t) router.push(t.route);
  },
});

async function logout() {
  await auth.logout();
  router.replace('/admin/login');
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <header class="g-nav sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
             style="background: linear-gradient(135deg, #B0736A, #C29185); color:#fff;">
          <i class="fas fa-utensils"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="font-bold truncate">健美滷味 後台</h1>
          <p class="text-xs truncate" style="color: var(--text-secondary)">{{ auth.account?.name || auth.account?.email }}</p>
        </div>
        <ThemeToggle />
        <button class="g-btn g-btn-glass g-btn-sm" @click="logout" title="登出">
          <i class="fas fa-right-from-bracket"></i>
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-4">
      <RouterView />
    </main>

    <BottomTabBar v-model="currentTab" :tabs="tabs" />
  </div>
</template>
