<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import ThemeToggle from '@/components/ThemeToggle.vue';

const auth = useOrganizerAuth();
const router = useRouter();
const route = useRoute();

async function logout() {
  await auth.logout();
  router.replace('/organizer/login');
}
</script>

<template>
  <div class="min-h-screen pb-12">
    <header class="g-nav sticky top-0 z-30">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <button class="g-btn g-btn-glass g-btn-sm" @click="router.push('/organizer')" title="首頁">
          <i class="fas fa-house"></i>
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="font-bold truncate">{{ auth.profile?.name || auth.profile?.displayName || '團購人' }}</h1>
          <p class="text-xs truncate" style="color: var(--text-secondary)">{{ auth.profile?.email }}</p>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm" @click="router.push('/organizer/profile')" title="個人資料">
          <i class="fas fa-user"></i>
        </button>
        <ThemeToggle />
        <button class="g-btn g-btn-glass g-btn-sm" @click="logout" title="登出">
          <i class="fas fa-right-from-bracket"></i>
        </button>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-4">
      <RouterView />
    </main>
  </div>
</template>
