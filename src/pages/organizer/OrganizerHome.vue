<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import {
  subscribeOrganizerSessions, ACTIVE_STATUSES, SESSION_STATUS,
} from '@/services/groupSessions.service';
import StatusBadge from '@/components/StatusBadge.vue';
import CustomAlert from '@/components/CustomAlert.vue';
import { fmtTs, fmtMoney } from '@/composables/useFmt';

const router = useRouter();
const auth = useOrganizerAuth();
const sessions = ref([]);
const loading = ref(true);
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

let unsub = null;
onMounted(() => {
  if (!auth.firebaseUser) return;
  unsub = subscribeOrganizerSessions(auth.firebaseUser.uid, (list) => {
    sessions.value = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    loading.value = false;
  });
});
onUnmounted(() => unsub && unsub());

const activeSession = computed(() => sessions.value.find((s) => ACTIVE_STATUSES.includes(s.status)) || null);
const closedSessions = computed(() =>
  sessions.value
    .filter((s) => s.status === SESSION_STATUS.CLOSED)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5)
);

// 固定永久網址：用 organizerUid 而非 sessionId，換團後同一網址持續有效
function shareUrl() {
  return `${window.location.origin}/order/${auth.firebaseUser?.uid}`;
}

async function copyShareUrl() {
  const url = shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    alertState.value = { show: true, title: '已複製', message: url, type: 'success' };
  } catch {
    alertState.value = { show: true, title: '複製失敗', message: url, type: 'warn' };
  }
}

function tryNewSession() {
  if (!auth.isProfileComplete) {
    alertState.value = {
      show: true, title: '請先完成個人資料', type: 'warn',
      message: '建立開團前請先在個人資料填寫姓名、電話、公司、地址。',
    };
    return;
  }
  if (activeSession.value) {
    alertState.value = {
      show: true, title: '已有進行中的開團', type: 'warn',
      message: '請先關閉現有開團（狀態：' + activeSession.value.status + '）後才能開新團。',
    };
    return;
  }
  router.push('/organizer/session/new');
}
</script>

<template>
  <section class="space-y-4">
    <!-- Active session card -->
    <div v-if="activeSession" class="g-card-solid p-4 animate-slide-up">
      <div class="flex items-start justify-between mb-2">
        <div>
          <p class="text-xs font-bold tracking-widest uppercase" style="color: var(--brand)">▌ 目前開團</p>
          <h2 class="text-xl font-bold mt-1">{{ activeSession.companyName }}</h2>
        </div>
        <StatusBadge :status="activeSession.status" />
      </div>
      <div class="text-sm space-y-1 mb-3">
        <p><i class="fas fa-truck mr-2 text-stone-400"></i>交貨：{{ fmtTs(activeSession.deliveryTime) }}</p>
        <p><i class="fas fa-cube mr-2 text-stone-400"></i>類型：{{ activeSession.orderType === 'vacuum' ? '真空' : '一般' }}</p>
        <p v-if="activeSession.totalAmount"><i class="fas fa-coins mr-2 text-stone-400"></i>目前總額：{{ fmtMoney(activeSession.totalAmount) }}</p>
      </div>
      <div class="g-card p-3 mb-3 break-all text-sm">
        <p class="g-label mb-1"><i class="fas fa-link mr-1"></i> 開團專屬網址（永久固定）</p>
        <p class="font-mono text-xs">{{ shareUrl() }}</p>
      </div>
      <div class="flex gap-2 flex-wrap justify-center">
        <button class="g-btn g-btn-brand" @click="router.push(`/organizer/session/${activeSession.id}`)">
          <i class="fas fa-clipboard-list"></i> 進入管理
        </button>
        <button class="g-btn g-btn-glass" @click="copyShareUrl()">
          <i class="fas fa-copy"></i> 複製網址
        </button>
      </div>
    </div>

    <!-- No active session -->
    <div v-else class="g-card-solid p-8 text-center">
      <i class="fas fa-store-slash text-4xl text-stone-400 mb-2"></i>
      <p class="text-stone-500 mb-4">目前沒有進行中的開團</p>
      <button class="g-btn g-btn-brand g-btn-lg" @click="tryNewSession">
        <i class="fas fa-plus"></i> 建立新開團
      </button>
    </div>

    <!-- History -->
    <div v-if="closedSessions.length">
      <h3 class="font-bold mb-2 text-sm" style="color: var(--text-secondary)">最近五次歷史開團</h3>
      <div class="space-y-2">
        <div v-for="s in closedSessions" :key="s.id" class="g-card-solid p-3 flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2"><span class="font-bold truncate">{{ s.companyName }}</span><StatusBadge :status="s.status" /></div>
            <p class="text-xs text-stone-500">{{ fmtTs(s.deliveryTime) }} · {{ fmtMoney(s.totalAmount || 0) }}</p>
          </div>
          <button class="g-btn g-btn-glass g-btn-sm" @click="router.push(`/organizer/session/${s.id}`)">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>

    <CustomAlert :show="alertState.show" :title="alertState.title" :message="alertState.message" :type="alertState.type"
                 @close="alertState.show = false" />
  </section>
</template>
