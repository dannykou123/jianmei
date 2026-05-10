<script setup>
import { ref, onMounted } from 'vue';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';
const LIFF_BIND_URL = import.meta.env.VITE_LIFF_BIND_URL || '/api/liff-bind';

const phase = ref('loading'); // loading | bound | no-token | error
const errorMsg = ref('');
const lineProfile = ref(null);
const addFriendUrl = ref('');

function loadLiff() {
  return new Promise((resolve, reject) => {
    if (window.liff) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('無法載入 LIFF SDK'));
    document.head.appendChild(s);
  });
}

function extractTokenFromUrl() {
  const search = new URLSearchParams(window.location.search);
  const direct = search.get('token');
  if (direct) return direct;

  const liffState = search.get('liff.state') || '';
  const stateParams = new URLSearchParams(
    liffState.startsWith('?') ? liffState.slice(1) : liffState
  );
  return stateParams.get('token') || '';
}

onMounted(async () => {
  try {
    if (!LIFF_ID) throw new Error('VITE_LIFF_ID 未設定');

    await loadLiff();
    await window.liff.init({ liffId: LIFF_ID });

    if (!window.liff.isLoggedIn()) {
      window.liff.login({ redirectUri: window.location.href });
      return;
    }

    lineProfile.value = await window.liff.getProfile();
    const bindingToken = extractTokenFromUrl();

    if (!bindingToken) {
      phase.value = 'no-token';
      return;
    }

    const lineIdToken = window.liff.getIDToken();

    const res = await fetch(LIFF_BIND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bindingToken, lineIdToken }),
    });

    const data = await res.json();

    if (data.success) {
      addFriendUrl.value = data.addFriendUrl || '';
      phase.value = 'bound';
    } else {
      throw new Error(data.message || '綁定失敗');
    }
  } catch (err) {
    errorMsg.value = err.message || '未知錯誤';
    phase.value = 'error';
  }
});

function closeWindow() {
  if (window.liff?.isInClient()) {
    window.liff.closeWindow();
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-10"
       style="background: linear-gradient(135deg, #B0736A 0%, #C29185 100%);">
    <div class="g-card-solid w-full max-w-xs sm:max-w-sm p-7 text-center animate-zoom-in">

      <!-- Brand -->
      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
           style="background: linear-gradient(135deg, #B0736A, #C29185); color:#fff;">
        <i class="fas fa-utensils text-xl"></i>
      </div>
      <h1 class="text-lg font-bold mb-0.5">健美滷味 團購系統</h1>
      <p class="text-xs mb-4" style="color: var(--text-secondary)">LINE 帳號綁定</p>

      <!-- Loading -->
      <div v-if="phase === 'loading'" class="py-8 space-y-3">
        <i class="fas fa-spinner fa-spin text-3xl" style="color: var(--brand)"></i>
        <p class="text-sm" style="color: var(--text-secondary)">驗證中，請稍候…</p>
      </div>

      <!-- Success -->
      <div v-else-if="phase === 'bound'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
             style="background: #d1fae5;">
          <i class="fas fa-circle-check text-3xl" style="color: #16a34a"></i>
        </div>
        <div>
          <p class="font-bold text-base">LINE 帳號綁定成功！</p>
          <p class="text-xs mt-1" style="color: var(--text-secondary)">
            往後訂單備貨、出貨、配送狀態將即時通知您。
          </p>
        </div>

        <!-- Profile -->
        <div v-if="lineProfile" class="flex items-center gap-3 p-3 rounded-xl text-left"
             style="background: var(--surface-2)">
          <img v-if="lineProfile.pictureUrl" :src="lineProfile.pictureUrl"
               class="w-10 h-10 rounded-full flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-medium text-sm truncate">{{ lineProfile.displayName }}</p>
            <p class="text-xs" style="color: var(--text-secondary)">已驗證 LINE 身分</p>
          </div>
        </div>

        <!-- Follow OA -->
        <a v-if="addFriendUrl" :href="addFriendUrl" target="_blank"
           class="g-btn g-btn-lg w-full flex items-center justify-center gap-2"
           style="background: #06C755; color: #fff; border: none;">
          <i class="fab fa-line text-lg"></i>
          加入官方帳號好友
        </a>

        <button class="g-btn g-btn-glass g-btn-lg w-full" @click="closeWindow">
          <i class="fas fa-xmark"></i> 關閉此頁
        </button>
      </div>

      <!-- No token -->
      <div v-else-if="phase === 'no-token'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
             style="background: var(--surface-2)">
          <i class="fas fa-link-slash text-2xl" style="color: var(--text-secondary)"></i>
        </div>
        <div>
          <p class="font-bold text-base">LINE 帳號狀態</p>
          <p class="text-xs mt-1" style="color: var(--text-secondary)">
            請從「個人資料」頁面點擊綁定連結，或掃描 QR Code 完成綁定。
          </p>
        </div>
        <div v-if="lineProfile" class="flex items-center gap-3 p-3 rounded-xl text-left"
             style="background: var(--surface-2)">
          <img v-if="lineProfile.pictureUrl" :src="lineProfile.pictureUrl"
               class="w-10 h-10 rounded-full flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-medium text-sm truncate">{{ lineProfile.displayName }}</p>
            <p class="text-xs" style="color: var(--text-secondary)">已通過 LINE 身分驗證</p>
          </div>
        </div>
        <button class="g-btn g-btn-glass g-btn-lg w-full" @click="closeWindow">
          <i class="fas fa-xmark"></i> 關閉
        </button>
      </div>

      <!-- Error -->
      <div v-else-if="phase === 'error'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
             style="background: #fee2e2;">
          <i class="fas fa-triangle-exclamation text-2xl" style="color: #dc2626"></i>
        </div>
        <div>
          <p class="font-bold text-base">綁定失敗</p>
          <p class="text-xs mt-1 px-2 py-2 rounded-lg text-left"
             style="background: var(--surface-2); color: var(--text-secondary)">
            {{ errorMsg }}
          </p>
        </div>
        <p class="text-xs" style="color: var(--text-secondary)">
          請返回後台「個人資料」重新申請綁定連結。
        </p>
        <button class="g-btn g-btn-glass g-btn-lg w-full" @click="closeWindow">
          <i class="fas fa-xmark"></i> 關閉
        </button>
      </div>

    </div>
  </div>
</template>
