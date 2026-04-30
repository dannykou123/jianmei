<script setup>
import { ref, computed, onMounted } from 'vue';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/firebase';
import { getActiveSessionByOrganizer, SESSION_STATUS } from '@/services/groupSessions.service';
import { createSessionOrder } from '@/services/groupSessionOrders.service';
import { useItemsStore } from '@/stores/useItemsStore';
import { fmtTs, fmtMoney } from '@/composables/useFmt';
import ThemeToggle from '@/components/ThemeToggle.vue';
import CustomAlert from '@/components/CustomAlert.vue';

// organizerId = 團購人 Firebase UID（固定永久網址）
const props = defineProps({ organizerId: { type: String, required: true } });

const session = ref(null);
const loading = ref(true);
const submitting = ref(false);
const submittedInfo = ref(null);   // { name, total }
const anonUid = ref('');

const customerName = ref('');
const customerUnit = ref('');
const note = ref('');
const qtyMap = ref({});
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

const store = useItemsStore();

const isOpen = computed(() => session.value?.status === SESSION_STATUS.OPEN);
const items = computed(() => session.value ? store.byType(session.value.orderType || 'regular') : []);
const totalAmount = computed(() => items.value.reduce((s, it) => s + (Number(qtyMap.value[it.id] || 0)) * (Number(it.price) || 0), 0));

// localStorage key 用 organizerId，同一個網址的已送出狀態 session 結束後自動失效
const STORAGE_KEY = computed(() => `submitted_${props.organizerId}_${session.value?.id || ''}`);

onMounted(async () => {
  try {
    // 嘗試匿名登入（給 Security Rules 使用）
    try {
      const cred = await signInAnonymously(auth);
      anonUid.value = cred.user.uid;
    } catch (e) {
      // 匿名登入失敗不阻擋讀取，但寫入會被 rules 擋
      console.warn('Anonymous auth failed:', e);
    }

    // 用團購人 UID 查詢當前活躍的 session
    const s = await getActiveSessionByOrganizer(props.organizerId);
    session.value = s;
    if (s && s.status === SESSION_STATUS.OPEN) {
      await store.fetch();
      // 預檢查 localStorage（用 organizerId+sessionId 組合，換團後自動重設）
      try {
        const key = `submitted_${props.organizerId}_${s.id}`;
        const prev = localStorage.getItem(key);
        if (prev) {
          const obj = JSON.parse(prev);
          submittedInfo.value = obj;
        }
      } catch {}
    }
  } finally {
    loading.value = false;
  }
});

function validate() {
  if (!customerName.value.trim()) return '請填寫姓名';
  if (!customerUnit.value) return '請選擇單位';
  const lines = items.value.filter((it) => Number(qtyMap.value[it.id] || 0) > 0);
  if (!lines.length) return '請至少選擇一項商品';
  return null;
}

async function submit() {
  const err = validate();
  if (err) {
    alertState.value = { show: true, title: '請檢查資料', message: err, type: 'warn' };
    return;
  }
  submitting.value = true;
  try {
    const lines = items.value
      .filter((it) => Number(qtyMap.value[it.id] || 0) > 0)
      .map((it) => {
        const q = Number(qtyMap.value[it.id]);
        const p = Number(it.price) || 0;
        return { itemName: it.name, qty: q, price: p, subtotal: q * p };
      });
    const total = totalAmount.value;
    await createSessionOrder({
      sessionId: session.value.id,
      customerName: customerName.value.trim(),
      customerUnit: customerUnit.value,
      items: lines,
      totalAmount: total,
      note: note.value || '',
      paid: false,
      source: 'customer',
      anonUid: anonUid.value,
    });
    const info = { name: customerName.value.trim(), total, at: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY.value, JSON.stringify(info)); } catch {}
    submittedInfo.value = info;
  } catch (e) {
    alertState.value = { show: true, title: '送出失敗', message: e.message, type: 'error' };
  } finally {
    submitting.value = false;
  }
}

function startNewOrder() {
  // 允許再下一筆（不同訂購人共用裝置情境）
  submittedInfo.value = null;
  customerName.value = '';
  customerUnit.value = '';
  note.value = '';
  qtyMap.value = {};
}
</script>

<template>
  <div class="min-h-screen pb-32">
    <header class="g-nav sticky top-0 z-30">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
             style="background: linear-gradient(135deg, #B0736A, #C29185); color:#fff;">
          <i class="fas fa-utensils"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="font-bold truncate">健美滷味 訂購</h1>
          <p v-if="session" class="text-xs truncate" style="color: var(--text-secondary)">{{ session.companyName }}</p>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-4">
      <div v-if="loading" class="text-center py-16 text-stone-500">
        <i class="fas fa-spinner fa-spin text-2xl"></i>
        <p class="mt-2">載入中...</p>
      </div>

      <div v-else-if="!session" class="g-card-solid p-8 text-center">
        <i class="fas fa-circle-question text-5xl text-stone-400 mb-3"></i>
        <h2 class="text-lg font-bold mb-2">找不到此開團</h2>
        <p class="text-stone-500 text-sm">網址可能輸入錯誤，請向團購人確認。</p>
      </div>

      <div v-else-if="!isOpen" class="g-card-solid p-8 text-center">
        <i class="fas fa-store-slash text-5xl text-stone-400 mb-3"></i>
        <h2 class="text-lg font-bold mb-2">目前無開團狀態</h2>
        <p class="text-stone-500 text-sm">請等候團購人重新開團或聯絡團購人。</p>
      </div>

      <div v-else-if="submittedInfo" class="g-card-solid p-8 text-center">
        <i class="fas fa-circle-check text-5xl text-green-600 mb-3"></i>
        <h2 class="text-lg font-bold mb-2">訂單已送出</h2>
        <p class="text-stone-600 mb-1">姓名：{{ submittedInfo.name }}</p>
        <p class="text-stone-600 mb-3">總金額：<span class="font-bold text-brand-700">{{ fmtMoney(submittedInfo.total) }}</span></p>
        <p class="text-sm text-stone-500 mb-4">請於交貨時繳款給團購人。<br />如需修改請通知團購人。</p>
        <button class="g-btn g-btn-glass" @click="startNewOrder">
          <i class="fas fa-plus"></i> 我要再幫人下一筆
        </button>
      </div>

      <div v-else class="space-y-4">
        <!-- Session info -->
        <div class="g-card-solid p-4">
          <p class="text-sm"><i class="fas fa-truck mr-2 text-stone-400"></i>交貨時間：{{ fmtTs(session.deliveryTime) }}</p>
          <p class="text-sm"><i class="fas fa-cube mr-2 text-stone-400"></i>類型：{{ session.orderType === 'vacuum' ? '真空' : '一般' }}</p>
        </div>

        <!-- Identity -->
        <div class="g-card-solid p-4 space-y-3">
          <h3 class="font-bold text-sm">您的資料</h3>
          <div><label class="g-label block mb-1">姓名 *</label><input v-model="customerName" class="g-input" /></div>
          <div>
            <label class="g-label block mb-1">單位 *</label>
            <select v-model="customerUnit" class="g-select">
              <option value="" disabled>請選擇</option>
              <option v-for="u in (session.units || [])" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <!-- Products -->
        <div class="g-card-solid p-4">
          <h3 class="font-bold text-sm mb-2">商品列表</h3>
          <div v-if="!items.length" class="text-center py-8 text-stone-400 text-sm">尚無可選商品</div>
          <div v-else class="space-y-2">
            <div v-for="it in items" :key="it.id" class="g-card p-3 flex items-center gap-2">
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm">{{ it.name }}</p>
                <p class="text-xs text-stone-500">{{ fmtMoney(it.price) }}</p>
                <p v-if="it.description" class="text-xs text-stone-500 truncate">{{ it.description }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" class="g-btn g-btn-glass g-btn-sm w-9 h-9 px-0"
                        @click="qtyMap[it.id] = Math.max(0, Number(qtyMap[it.id] || 0) - 1)">
                  <i class="fas fa-minus"></i>
                </button>
                <input v-model.number="qtyMap[it.id]" type="number" min="0"
                       class="g-input text-center" style="width:4rem;height:2.25rem" />
                <button type="button" class="g-btn g-btn-glass g-btn-sm w-9 h-9 px-0"
                        @click="qtyMap[it.id] = Number(qtyMap[it.id] || 0) + 1">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Note -->
        <div class="g-card-solid p-4">
          <label class="g-label block mb-1">備註（選填）</label>
          <textarea v-model="note" class="g-input" rows="2" placeholder="例：辣度、不要香菜..."></textarea>
        </div>
      </div>
    </main>

    <!-- Sticky bottom action -->
    <div v-if="isOpen && !submittedInfo && session"
         class="fixed bottom-0 left-0 right-0 g-nav border-t z-30"
         style="padding-bottom: env(safe-area-inset-bottom, 0px);">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs text-stone-500">總金額</p>
          <p class="text-2xl font-bold text-brand-700">{{ fmtMoney(totalAmount) }}</p>
        </div>
        <button class="g-btn g-btn-brand g-btn-lg flex-1 max-w-xs" :disabled="submitting || totalAmount <= 0" @click="submit">
          <i class="fas fa-paper-plane"></i> {{ submitting ? '送出中...' : '送出訂單' }}
        </button>
      </div>
    </div>

    <CustomAlert :show="alertState.show" :title="alertState.title" :message="alertState.message" :type="alertState.type"
                 @close="alertState.show = false" />
  </div>
</template>
