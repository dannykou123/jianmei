<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminAuth } from '@/stores/useAdminAuth';
import ThemeToggle from '@/components/ThemeToggle.vue';
import CustomAlert from '@/components/CustomAlert.vue';

const router = useRouter();
const route = useRoute();
const auth = useAdminAuth();
const submitting = ref(false);
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

async function handleLogin() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await auth.login();
    if (!auth.isLoggedIn) {
      alertState.value = { show: true, title: '登入失敗', message: '請重試或聯絡管理員', type: 'error' };
      return;
    }
    if (!auth.isAuthorized) {
      alertState.value = {
        show: true,
        title: '帳號待授權',
        message: `您的帳號 ${auth.account?.email || ''} 已建立，需由管理員授權後才能登入。`,
        type: 'warn',
      };
      return;
    }
    const redirect = route.query.redirect || '/admin';
    router.replace(redirect);
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
          <i class="fas fa-store text-2xl"></i>
        </div>
        <h1 class="text-2xl font-bold mb-1">健美滷味 後台</h1>
        <p class="text-sm" style="color: var(--text-secondary)">管理員登入</p>
      </div>
      <button class="g-btn g-btn-brand g-btn-lg w-full" :disabled="submitting" @click="handleLogin">
        <i class="fab fa-google"></i>
        <span>{{ submitting ? '登入中...' : '使用 Google 登入' }}</span>
      </button>
    </div>
    <CustomAlert
      :show="alertState.show"
      :title="alertState.title"
      :message="alertState.message"
      :type="alertState.type"
      @close="alertState.show = false"
    />
  </div>
</template>
