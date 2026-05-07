<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-8">

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
      <div
        v-else-if="notFound"
        class="bg-white dark:bg-stone-800 rounded-2xl p-6 text-center shadow-sm border border-stone-100 dark:border-stone-700"
      >
        <i class="fa-solid fa-circle-xmark text-3xl text-stone-300 mb-3 block"></i>
        <p class="text-sm text-stone-600 dark:text-stone-400">查無訂單「{{ lastQueried }}」</p>
        <p class="text-xs text-stone-400 mt-1">請確認訂單編號是否正確</p>
      </div>

      <!-- 訂單結果卡片 -->
      <template v-if="order">
        <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">

          <!-- 卡片標題 -->
          <div class="bg-stone-50 dark:bg-stone-700/60 px-4 py-3 flex items-center justify-between">
            <div>
              <p class="text-xs text-stone-400 dark:text-stone-500">訂單編號</p>
              <p class="text-sm font-bold text-stone-800 dark:text-stone-100 tracking-wider">{{ order.orderNo }}</p>
            </div>
            <span
              class="px-3 py-1 rounded-full text-xs font-bold"
              :class="statusStyle.bg"
            >
              {{ statusStyle.label }}
            </span>
          </div>

          <!-- 訂單資訊 -->
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

          <!-- 商品明細 -->
          <div class="border-t border-stone-100 dark:border-stone-700 px-4 py-3">
            <p class="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2 uppercase tracking-wide">商品明細</p>
            <div
              v-for="item in order.items"
              :key="item.itemName"
              class="flex items-center justify-between py-1"
            >
              <span class="text-sm text-stone-700 dark:text-stone-300 flex-1">{{ item.itemName }}</span>
              <span class="text-xs text-stone-400 mx-3">x{{ item.qty }}</span>
              <span class="text-sm font-medium text-stone-800 dark:text-stone-100">${{ item.subtotal }}</span>
            </div>
          </div>

          <!-- 合計 + 備註 -->
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

        <!-- LINE 帳號綁定區塊（LIFF 環境才顯示） -->
        <div
          v-if="isInLineClient && lineUserId && !alreadyBound"
          class="bg-[#06C755]/10 border border-[#06C755]/30 rounded-2xl p-4"
        >
          <div class="flex items-start gap-3">
            <i class="fa-brands fa-line text-[#06C755] text-2xl mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-medium text-stone-800 dark:text-stone-100">綁定 LINE 帳號</p>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                綁定後，訂單審核結果將自動推播通知給您
              </p>
              <button
                @click="bindLineAccount"
                :disabled="binding"
                class="mt-3 w-full bg-[#06C755] hover:bg-[#05b54b] disabled:opacity-50 text-white rounded-xl py-2 text-sm font-medium transition-colors"
              >
                <i v-if="binding" class="fa-solid fa-spinner fa-spin mr-1"></i>
                {{ binding ? '綁定中…' : '綁定此訂單到我的 LINE' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 已綁定提示 -->
        <div
          v-if="alreadyBound"
          class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-3 flex items-center gap-2"
        >
          <i class="fa-solid fa-circle-check text-emerald-500"></i>
          <p class="text-sm text-emerald-700 dark:text-emerald-400">已綁定 LINE 帳號，審核結果將自動通知您</p>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { collection, query, where, limit, getDocs, doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/index.js';
import { useLiff } from '@/composables/useLiff';
import { fmtTs } from '@/composables/useFmt.js';

const { isInLineClient, liffProfile, initLiff } = useLiff();

// ── LIFF 初始化 ──────────────────────────────
const LIFF_STATUS_ID = import.meta.env.VITE_LIFF_STATUS_ID;
initLiff(LIFF_STATUS_ID);

// 透過 computed 取得 lineUserId，確保 reactive
const lineUserId = computed(() => liffProfile.value?.userId ?? null);

// ── 查詢狀態 ──────────────────────────────────
const inputOrderNo = ref('');
const searching = ref(false);
const notFound = ref(false);
const lastQueried = ref('');
const order = ref(null);

// ── 綁定狀態 ──────────────────────────────────
const binding = ref(false);
const alreadyBound = ref(false);

// ── 訂單狀態 badge 樣式 ────────────────────────
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

// ── 查詢訂單 ──────────────────────────────────
async function searchOrder() {
  const no = inputOrderNo.value.trim();
  if (no.length !== 13 || !/^\d{13}$/.test(no)) return;

  searching.value = true;
  notFound.value = false;
  order.value = null;
  alreadyBound.value = false;
  lastQueried.value = no;

  try {
    const snap = await getDocs(
      query(collection(db, 'GroupSessionOrders'), where('orderNo', '==', no), limit(1))
    );

    if (snap.empty) {
      notFound.value = true;
      return;
    }

    const orderData = snap.docs[0].data();

    // 取得對應 session 狀態
    let sessionStatus = 'open';
    try {
      const sessionSnap = await getDocs(
        query(collection(db, 'GroupSessions'), where('__name__', '==', orderData.sessionId), limit(1))
      );
      if (!sessionSnap.empty) sessionStatus = sessionSnap.docs[0].data().status || 'open';
    } catch (_) { /* 不影響主功能 */ }

    order.value = { ...orderData, sessionStatus };

    // 若已在 LINE 環境，檢查是否已綁定
    if (lineUserId.value) {
      await checkBinding(no);
    }
  } catch (err) {
    console.error('[LineOrderStatus] 查詢失敗:', err);
  } finally {
    searching.value = false;
  }
}

// ── 檢查是否已綁定 ────────────────────────────
async function checkBinding(orderNo) {
  if (!lineUserId.value) return;
  try {
    const bindingSnap = await getDocs(
      query(
        collection(db, 'lineBindings'),
        where('lineUserId', '==', lineUserId.value),
        where('orderNos', 'array-contains', orderNo),
        limit(1)
      )
    );
    alreadyBound.value = !bindingSnap.empty;
  } catch (_) { /* 查不到不影響用戶 */ }
}

// ── 綁定 LINE 帳號 ────────────────────────────
async function bindLineAccount() {
  if (!lineUserId.value || !order.value?.orderNo) return;
  binding.value = true;
  try {
    const bindingRef = doc(db, 'lineBindings', lineUserId.value);
    // 使用 setDoc merge 方式，安全地 append orderNo 到陣列
    const existingSnap = await getDocs(
      query(collection(db, 'lineBindings'), where('lineUserId', '==', lineUserId.value), limit(1))
    );

    if (existingSnap.empty) {
      // 首次綁定
      await setDoc(bindingRef, {
        lineUserId: lineUserId.value,
        orderNos: [order.value.orderNo],
        customerName: order.value.customerName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // 已有紀錄，append orderNo（arrayUnion 確保不重複）
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
