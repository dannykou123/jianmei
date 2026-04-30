<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import ThemeToggle from '@/components/ThemeToggle.vue';
import CustomAlert from '@/components/CustomAlert.vue';

const auth = useOrganizerAuth();
const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

async function handleLogin() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await auth.login();
    if (auth.isLoggedIn) {
      const redirect = route.query.redirect || '/organizer';
      router.replace(redirect);
    }
  } catch (e) {
    alertState.value = { show: true, title: '登入錯誤', message: e.message || String(e), type: 'error' };
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6">
    <div class="absolute top-4 right-4"><ThemeToggle /></div>
    <div class="g-card-solid max-w-sm w-full p-8 animate-zoom-in">
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
             style="background: linear-gradient(135deg, #B0736A, #C29185); color:#fff;">
          <i class="fas fa-people-group text-2xl"></i>
        </div>
        <h1 class="text-2xl font-bold mb-1">健美滷味 團購人</h1>
        <p class="text-sm" style="color: var(--text-secondary)">使用 Google 登入後即可開團</p>
      </div>
      <button class="g-btn g-btn-brand g-btn-lg w-full" :disabled="submitting" @click="handleLogin">
        <i class="fab fa-google"></i>
        <span>{{ submitting ? '登入中...' : '使用 Google 登入' }}</span>
      </button>
      <p class="text-xs text-center mt-4" style="color: var(--text-muted)">
        首次登入會自動建立您的團購人帳號
      </p>
    </div>
    <CustomAlert
      :show="alertState.show" :title="alertState.title" :message="alertState.message" :type="alertState.type"
      @close="alertState.show = false"
    />
  </div>
</template>
