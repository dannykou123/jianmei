<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import {
  subscribeGroupOrders, listOrdersByGroup, updateGroupOrder, deleteGroupOrder, batchDeleteGroupWithOrders,
} from '@/services/orders.service';
import { useAdminAuth } from '@/stores/useAdminAuth';
import { Timestamp } from 'firebase/firestore';
import { fmtTs, fmtMoney, fmtDate } from '@/composables/useFmt';
import StatusBadge from '@/components/StatusBadge.vue';
import GlassModal from '@/components/GlassModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const auth = useAdminAuth();
const list = ref([]);
const loading = ref(true);
const detailModal = ref({ show: false, group: null, orders: [] });
const confirmState = ref({ show: false, action: null, group: null });

let unsub = null;
onMounted(() => {
  unsub = subscribeGroupOrders((items) => {
    list.value = items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
    loading.value = false;
  }, { status: 'pending' });
});
onUnmounted(() => unsub && unsub());

async function openDetail(group) {
  const orders = await listOrdersByGroup(group.id);
  detailModal.value = { show: true, group, orders };
}

function askApprove(group) {
  confirmState.value = { show: true, action: 'approve', group };
}
function askReject(group) {
  confirmState.value = { show: true, action: 'reject', group };
}

async function handleConfirm() {
  const { action, group } = confirmState.value;
  if (!group) return;
  const now = new Date().toISOString();
  if (action === 'approve') {
    await updateGroupOrder(group.id, {
      status: 'approved',
      approvedAt: Timestamp.now(),
      approvedBy: auth.account?.email || '',
      updatedAt: now,
    });
  } else if (action === 'reject') {
    await updateGroupOrder(group.id, {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectedBy: auth.account?.email || '',
      updatedAt: now,
    });
  } else if (action === 'delete') {
    await batchDeleteGroupWithOrders(group.id);
  }
  confirmState.value = { show: false, action: null, group: null };
  if (detailModal.value.group?.id === group.id) detailModal.value.show = false;
}

const confirmText = computed(() => {
  const a = confirmState.value.action;
  if (a === 'approve') return { title: '確認接單？', confirm: '接單', danger: false };
  if (a === 'reject') return { title: '確認拒絕？', confirm: '拒絕', danger: true };
  if (a === 'delete') return { title: '確認刪除？', confirm: '刪除', danger: true };
  return { title: '', confirm: '確認', danger: false };
});
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">待審核訂單 <span class="text-sm font-normal text-stone-500">({{ list.length }})</span></h2>
    </div>

    <div v-if="loading" class="text-center py-12 text-stone-500">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
      <p class="mt-2">載入中...</p>
    </div>

    <div v-else-if="!list.length" class="g-card-solid p-8 text-center">
      <i class="fas fa-inbox text-4xl text-stone-400 mb-2"></i>
      <p class="text-stone-500">目前沒有待審核訂單</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="g in list" :key="g.id" class="g-card-solid p-4">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <h3 class="font-bold truncate">{{ g.companyName }}</h3>
              <StatusBadge :status="g.status" />
              <span class="text-xs g-badge g-badge-neutral">{{ g.orderType === 'vacuum' ? '真空' : '一般' }}</span>
            </div>
            <p class="text-sm text-stone-600">{{ g.contactName }} · {{ g.contactPhone }}</p>
            <p class="text-sm text-stone-500 truncate">{{ g.address }}</p>
            <p class="text-sm mt-1">
              <i class="fas fa-truck mr-1"></i>交貨：{{ fmtTs(g.deliveryTime) }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-lg font-bold text-brand-700">{{ fmtMoney(g.totalAmount) }}</p>
            <p class="text-xs text-stone-400">{{ fmtTs(g.createdAt) }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <button class="g-btn g-btn-glass g-btn-sm" @click="openDetail(g)">
            <i class="fas fa-eye"></i> 明細
          </button>
          <button class="g-btn g-btn-success g-btn-sm" @click="askApprove(g)">
            <i class="fas fa-check"></i> 接單
          </button>
          <button class="g-btn g-btn-danger g-btn-sm" @click="askReject(g)">
            <i class="fas fa-xmark"></i> 拒絕
          </button>
        </div>
      </div>
    </div>

    <GlassModal :show="detailModal.show" :title="detailModal.group?.companyName || '訂單明細'"
                @close="detailModal.show = false">
      <div v-if="detailModal.group" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="g-label block mb-1">聯絡人</span>{{ detailModal.group.contactName }}</div>
          <div><span class="g-label block mb-1">電話</span>{{ detailModal.group.contactPhone }}</div>
          <div class="col-span-2"><span class="g-label block mb-1">地址</span>{{ detailModal.group.address }}</div>
          <div><span class="g-label block mb-1">交貨時間</span>{{ fmtTs(detailModal.group.deliveryTime) }}</div>
          <div><span class="g-label block mb-1">總金額</span>{{ fmtMoney(detailModal.group.totalAmount) }}</div>
        </div>
        <div>
          <h4 class="font-bold mb-2">訂購人列表（{{ detailModal.orders.length }}）</h4>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div v-for="o in detailModal.orders" :key="o.id" class="g-card p-3">
              <div class="flex justify-between mb-1">
                <span class="font-bold">{{ o.customerName }} <span class="text-xs text-stone-500">{{ o.customerUnit }}</span></span>
                <span class="font-bold text-brand-700">{{ fmtMoney(o.totalAmount) }}</span>
              </div>
              <ul class="text-sm text-stone-600 space-y-1">
                <li v-for="(it, i) in o.items || []" :key="i">
                  {{ it.itemName }} × {{ it.qty }} = {{ fmtMoney(it.subtotal) }}
                </li>
              </ul>
              <p v-if="o.note" class="text-xs text-stone-500 mt-1">備註：{{ o.note }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="g-btn g-btn-success" @click="askApprove(detailModal.group)">
          <i class="fas fa-check"></i> 接單
        </button>
        <button class="g-btn g-btn-danger" @click="askReject(detailModal.group)">
          <i class="fas fa-xmark"></i> 拒絕
        </button>
        <button class="g-btn g-btn-glass" @click="detailModal.show = false">關閉</button>
      </template>
    </GlassModal>

    <ConfirmDialog
      :show="confirmState.show"
      :title="confirmText.title"
      :confirm-text="confirmText.confirm"
      :danger="confirmText.danger"
      :message="confirmState.group?.companyName || ''"
      @confirm="handleConfirm"
      @cancel="confirmState.show = false"
    />
  </section>
</template>
