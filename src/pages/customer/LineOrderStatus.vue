<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, query, where, limit, getDocs, doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/index.js';
import { useLiff } from '@/composables/useLiff';
import { fmtTs } from '@/composables/useFmt.js';

const { isInLineClient, liffProfile, initLiff } = useLiff();

// ── 模式判斷（reactive，LIFF init 後才確定）────────────────────────
// 從 URL 讀取 token：直接在 query string，或藏在 liff.state 裡（LINE App 打開時）
function extractTokenFromUrl() {
  const search = new URLSearchParams(window.location.search);
  const direct = search.get('token');
  if (direct) return direct;
  // LINE App 打開 LIFF 時，額外參數會先被包在 liff.state 裡
  const liffState = search.get('liff.state') || '';
  const stateParams = new URLSearchParams(
    liffState.startsWith('?') ? liffState.slice(1) : liffState
  );
  return stateParams.get('token') || '';
}

const mode = ref('loading'); // 'loading' | 'bind' | 'lookup'

const LIFF_BIND_ID   = import.meta.env.VITE_LIFF_ID || '';
const LIFF_STATUS_ID = import.meta.env.VITE_LIFF_STATUS_ID || '';
const LIFF_BIND_URL  = import.meta.env.VITE_LIFF_BIND_URL || '/api/liff-bind';

onMounted(async () => {
  const preToken = extractTokenFromUrl();
  const liffId = preToken ? LIFF_BIND_ID : (LIFF_STATUS_ID || LIFF_BIND_ID);

  try {
    // LIFF init 加 10 秒 timeout 防止永久loading
    await Promise.race([
      initLiff(liffId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('LIFF init timeout')), 10000)),
    ]);
  } catch (err) {
    console.warn('[LineOrderStatus] LIFF init 失敗，降級處理:', err.message);
  }

  // LIFF SDK init 後，liff.state 已被解析，重新讀取 URL 中的 token
  const urlToken = extractTokenFromUrl();
  if (urlToken) {
    mode.value = 'bind';
    await runBindFlow(urlToken);
  } else {
    mode.value = 'lookup';
  }
});

// ════════════════════════════════════════════════
// 綁定模式
// ════════════════════════════════════════════════
const bindPhase = ref('loading'); // loading | bound | error
const bindError = ref('');
const addFriendUrl = ref('');

async function runBindFlow(urlToken) {
  try {
    // Module mode ON：liff.init() 不自動登入，需手動呼叫 liff.login()
    if (window.liff && !window.liff.isLoggedIn()) {
      window.liff.login({ redirectUri: window.location.href });
      return;
    }

    const lineIdToken = window.liff?.getIDToken();
    if (!lineIdToken) throw new Error('無法取得 LINE 身分驗證 Token，請重新掃描');

    const res = await fetch(LIFF_BIND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bindingToken: urlToken, lineIdToken }),
    });

    const data = await res.json();

    if (data.success) {
      addFriendUrl.value = data.addFriendUrl || '';
      bindPhase.value = 'bound';
    } else {
      throw new Error(data.message || '綁定失敗');
    }
  } catch (err) {
    bindError.value = err.message || '未知錯誤';
    bindPhase.value = 'error';
  }
}

function closeWindow() {
  if (window.liff?.isInClient()) {
    window.liff.closeWindow();
  } else {
    // 外部瀏覽器：嘗試關閉，失敗則導回首頁
    window.close();
    setTimeout(() => { window.location.href = '/'; }, 300);
  }
}

// ════════════════════════════════════════════════
// 查詢模式
// ════════════════════════════════════════════════
const lineUserId = computed(() => liffProfile.value?.userId ?? null);

const inputOrderNo = ref('');
const searching    = ref(false);
const notFound     = ref(false);
const lastQueried  = ref('');
const order        = ref(null);
const binding      = ref(false);
const alreadyBound = ref(false);

const STATUS_MAP = {
  open:     { label: '開放中', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  pending:  { label: '審核中', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  approved: { label: '已核准', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  rejected: { label: '已拒絕', bg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  closed:   { label: '已結束', bg: 'bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-400' },
};

const statusStyle = computed(() => {
  const s = order.value?.sessionStatus || 'open';
  return STATUS_MAP[s] ?? { label: s, bg: 'bg-stone-100 text-stone-500' };
});

async function searchOrder() {
  const no = inputOrderNo.value.trim();
  if (no.length !== 13 || !/^\d{13}$/.test(no)) return;

  searching.value = true;
  notFound.value  = false;
  order.value     = null;
  alreadyBound.value = false;
  lastQueried.value  = no;

  try {
    const snap = await getDocs(
      query(collection(db, 'GroupSessionOrders'), where('orderNo', '==', no), limit(1))
    );

    if (snap.empty) { notFound.value = true; return; }

    const orderData = snap.docs[0].data();

    let sessionStatus = 'open';
    try {
      const sessionSnap = await getDocs(
        query(collection(db, 'GroupSessions'), where('__name__', '==', orderData.sessionId), limit(1))
      );
      if (!sessionSnap.empty) sessionStatus = sessionSnap.docs[0].data().status || 'open';
    } catch (_) { /* 不影響主功能 */ }

    order.value = { ...orderData, sessionStatus };

    if (lineUserId.value) await checkBinding(no);
  } catch (err) {
    console.error('[LineOrderStatus] 查詢失敗:', err);
  } finally {
    searching.value = false;
  }
}

async function checkBinding(orderNo) {
  if (!lineUserId.value) return;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'lineBindings'),
        where('lineUserId', '==', lineUserId.value),
        where('orderNos', 'array-contains', orderNo),
        limit(1)
      )
    );
    alreadyBound.value = !snap.empty;
  } catch (_) { /* 查不到不影響用戶 */ }
}

async function bindLineAccount() {
  if (!lineUserId.value || !order.value?.orderNo) return;
  binding.value = true;
  try {
    const bindingRef = doc(db, 'lineBindings', lineUserId.value);
    const existingSnap = await getDocs(
      query(collection(db, 'lineBindings'), where('lineUserId', '==', lineUserId.value), limit(1))
    );

    if (existingSnap.empty) {
      await setDoc(bindingRef, {
        lineUserId: lineUserId.value,
        orderNos: [order.value.orderNo],
        customerName: order.value.customerName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        bindingRef,
        { orderNos: arrayUnion(order.value.orderNo), updatedAt: serverTimestamp() },
        { merge: true }
      );
    }

    alreadyBound.value = true;
  } catch (err) {
    console.error('[LineOrderStatus] 綁定失敗:', err);
  } finally {
    binding.value = false;
  }
}
</script>

<template>
  <!-- ══ 載入中（LIFF 初始化 / 模式判斷）══════════════════════════ -->
  <div v-if="mode === 'loading'"
       class="min-h-screen flex items-center justify-center"
       style="background: linear-gradient(135deg, #B0736A 0%, #C29185 100%);">
    <div class="text-white text-center space-y-3">
      <i class="fas fa-spinner fa-spin text-4xl"></i>
      <p class="text-sm opacity-80">載入中…</p>
    </div>
  </div>

  <!-- ══ 綁定模式 ════════════════════════════════════════════════ -->
  <div v-else-if="mode === 'bind'"
       class="min-h-screen flex flex-col items-center justify-center px-4 py-10"
       style="background: linear-gradient(135deg, #B0736A 0%, #C29185 100%);">
    <div class="g-card-solid w-full max-w-xs sm:max-w-sm p-7 text-center animate-zoom-in">

      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
           style="background: linear-gradient(135deg, #B0736A, #C29185); color:#fff;">
        <i class="fas fa-utensils text-xl"></i>
      </div>
      <h1 class="text-lg font-bold mb-0.5">健美滷味 團購系統</h1>
      <p class="text-xs mb-4" style="color: var(--text-secondary)">LINE 帳號綁定</p>

      <!-- 載入中 -->
      <div v-if="bindPhase === 'loading'" class="py-8 space-y-3">
        <i class="fas fa-spinner fa-spin text-3xl" style="color: var(--brand)"></i>
        <p class="text-sm" style="color: var(--text-secondary)">驗證中，請稍候…</p>
      </div>

      <!-- 成功 -->
      <div v-else-if="bindPhase === 'bound'" class="space-y-4">
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
        <div v-if="liffProfile" class="flex items-center gap-3 p-3 rounded-xl text-left"
             style="background: var(--surface-2)">
          <img v-if="liffProfile.pictureUrl" :src="liffProfile.pictureUrl"
               class="w-10 h-10 rounded-full flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-medium text-sm truncate">{{ liffProfile.displayName }}</p>
            <p class="text-xs" style="color: var(--text-secondary)">已驗證 LINE 身分</p>
          </div>
        </div>
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

      <!-- 失敗 -->
      <div v-else-if="bindPhase === 'error'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
             style="background: #fee2e2;">
          <i class="fas fa-triangle-exclamation text-2xl" style="color: #dc2626"></i>
        </div>
        <div>
          <p class="font-bold text-base">綁定失敗</p>
          <p class="text-xs mt-1 px-2 py-2 rounded-lg text-left"
             style="background: var(--surface-2); color: var(--text-secondary)">
            {{ bindError }}
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

  <!-- ══ 查詢模式 ════════════════════════════════════════════════ -->
  <div v-else-if="mode === 'lookup'" class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-8">

    <!-- 頂部標題列 -->
    <div class="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-4 py-4">
      <div class="flex items-center gap-3 max-w-lg mx-auto">
        <div class="w-10 h-10 rounded-full bg-[#B0736A] flex items-center justify-center text-white text-lg">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <div>
          <h1 class="text-base font-bold text-stone-800 dark:text-stone-100">訂單查詢</h1>
          <p class="text-xs text-stone-500 dark:text-stone-400">輸入訂單編號查詢訂購狀態</p>
        </div>
      </div>
    </div>

    <div class="max-w-lg mx-auto px-4 py-6 space-y-4">

      <!-- 查詢輸入框 -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-700">
        <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          訂單編號（13 碼）
        </label>
        <div class="flex gap-2">
          <input
            v-model="inputOrderNo"
            type="text"
            inputmode="numeric"
            maxlength="13"
            placeholder="例：2605041234567"
            class="flex-1 border border-stone-200 dark:border-stone-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B0736A]"
            @keydown.enter="searchOrder"
          />
          <button
            @click="searchOrder"
            :disabled="searching || inputOrderNo.length !== 13"
            class="bg-[#B0736A] hover:bg-[#9e6560] disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
        <p v-if="inputOrderNo && inputOrderNo.length !== 13" class="text-xs text-orange-500 mt-1">
          訂單編號需為 13 碼數字
        </p>
      </div>

      <!-- 載入中 -->
      <div v-if="searching" class="text-center py-8 text-stone-400">
        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
        <p class="text-sm">查詢中…</p>
      </div>

      <!-- 查無結果 -->
      <div v-else-if="notFound"
           class="bg-white dark:bg-stone-800 rounded-2xl p-6 text-center shadow-sm border border-stone-100 dark:border-stone-700">
        <i class="fa-solid fa-circle-xmark text-3xl text-stone-300 mb-3 block"></i>
        <p class="text-sm text-stone-600 dark:text-stone-400">查無訂單「{{ lastQueried }}」</p>
        <p class="text-xs text-stone-400 mt-1">請確認訂單編號是否正確</p>
      </div>

      <!-- 訂單結果 -->
      <template v-if="order">
        <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">

          <div class="bg-stone-50 dark:bg-stone-700/60 px-4 py-3 flex items-center justify-between">
            <div>
              <p class="text-xs text-stone-400 dark:text-stone-500">訂單編號</p>
              <p class="text-sm font-bold text-stone-800 dark:text-stone-100 tracking-wider">{{ order.orderNo }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold" :class="statusStyle.bg">
              {{ statusStyle.label }}
            </span>
          </div>

          <div class="px-4 py-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-stone-500 dark:text-stone-400">訂購人</span>
              <span class="text-stone-800 dark:text-stone-100 font-medium">{{ order.customerName || '—' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-stone-500 dark:text-stone-400">單位</span>
              <span class="text-stone-800 dark:text-stone-100">{{ order.customerUnit || '—' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-stone-500 dark:text-stone-400">建立時間</span>
              <span class="text-stone-800 dark:text-stone-100">{{ fmtTs(order.createdAt) }}</span>
            </div>
          </div>

          <div class="border-t border-stone-100 dark:border-stone-700 px-4 py-3">
            <p class="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2 uppercase tracking-wide">商品明細</p>
            <div v-for="item in order.items" :key="item.itemName"
                 class="flex items-center justify-between py-1">
              <span class="text-sm text-stone-700 dark:text-stone-300 flex-1">{{ item.itemName }}</span>
              <span class="text-xs text-stone-400 mx-3">x{{ item.qty }}</span>
              <span class="text-sm font-medium text-stone-800 dark:text-stone-100">${{ item.subtotal }}</span>
            </div>
          </div>

          <div class="border-t border-stone-100 dark:border-stone-700 px-4 py-3 space-y-2">
            <div class="flex justify-between text-sm font-bold">
              <span class="text-stone-700 dark:text-stone-300">合計</span>
              <span class="text-[#B0736A]">${{ order.totalAmount?.toLocaleString() }}</span>
            </div>
            <div v-if="order.note" class="text-xs text-stone-500 dark:text-stone-400">
              備註：{{ order.note }}
            </div>
          </div>
        </div>

        <!-- LINE 綁定區塊 -->
        <div v-if="isInLineClient && lineUserId && !alreadyBound"
             class="bg-[#06C755]/10 border border-[#06C755]/30 rounded-2xl p-4">
          <div class="flex items-start gap-3">
            <i class="fa-brands fa-line text-[#06C755] text-2xl mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-medium text-stone-800 dark:text-stone-100">綁定 LINE 帳號</p>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                綁定後，訂單審核結果將自動推播通知給您
              </p>
              <button @click="bindLineAccount" :disabled="binding"
                      class="mt-3 w-full bg-[#06C755] hover:bg-[#05b54b] disabled:opacity-50 text-white rounded-xl py-2 text-sm font-medium transition-colors">
                <i v-if="binding" class="fa-solid fa-spinner fa-spin mr-1"></i>
                {{ binding ? '綁定中…' : '綁定此訂單到我的 LINE' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 已綁定提示 -->
        <div v-if="alreadyBound"
             class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-3 flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-500"></i>
          <p class="text-sm text-emerald-700 dark:text-emerald-400">已綁定 LINE 帳號，審核結果將自動通知您</p>
        </div>
      </template>

    </div>
  </div>
</template>
