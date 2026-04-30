<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Timestamp } from 'firebase/firestore';
import {
  subscribeSession, updateSession, deleteSession, SESSION_STATUS,
} from '@/services/groupSessions.service';
import {
  subscribeOrdersBySession, createSessionOrder, updateSessionOrder, deleteSessionOrder,
} from '@/services/groupSessionOrders.service';
import {
  subscribeOrdersByGroup, batchCreateGroupWithOrders, batchDeleteGroupWithOrders, updateOrder,
} from '@/services/orders.service';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import { fmtTs, fmtMoney } from '@/composables/useFmt';
import StatusBadge from '@/components/StatusBadge.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CustomAlert from '@/components/CustomAlert.vue';
import AddOrderModal from './AddOrderModal.vue';

const props = defineProps({ id: { type: String, required: true } });
const router = useRouter();
const auth = useOrganizerAuth();

const session = ref(null);
const sessionOrders = ref([]);   // open 期間用
const groupOrders = ref([]);     // 送審後用（Orders collection）
const loading = ref(true);

let unsubSession = null;
let unsubSessionOrders = null;
let unsubGroupOrders = null;

const isLocked = computed(() => session.value?.status === SESSION_STATUS.APPROVED);
const useSessionData = computed(() => session.value?.status === SESSION_STATUS.OPEN);

const displayedOrders = computed(() => useSessionData.value ? sessionOrders.value : groupOrders.value);

const totalAmount = computed(() => filteredOrders.value.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0));
const paidAmount = computed(() => filteredOrders.value.filter((o) => o.paid).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0));

onMounted(() => {
  unsubSession = subscribeSession(props.id, (s) => {
    session.value = s;
    loading.value = false;
    rewireOrdersSubscription();
  });
});

function rewireOrdersSubscription() {
  if (!session.value) return;
  if (useSessionData.value) {
    if (unsubGroupOrders) { unsubGroupOrders(); unsubGroupOrders = null; }
    if (!unsubSessionOrders) {
      unsubSessionOrders = subscribeOrdersBySession(props.id, (list) => {
        sessionOrders.value = list;
      });
    }
  } else if (session.value.linkedGroupOrderId) {
    if (unsubSessionOrders) { unsubSessionOrders(); unsubSessionOrders = null; }
    if (!unsubGroupOrders) {
      unsubGroupOrders = subscribeOrdersByGroup(session.value.linkedGroupOrderId, (list) => {
        groupOrders.value = list;
      });
    }
  }
}

onUnmounted(() => {
  unsubSession && unsubSession();
  unsubSessionOrders && unsubSessionOrders();
  unsubGroupOrders && unsubGroupOrders();
});

// ── Add/Edit/Delete order ─────────────────────────
const orderModal = ref({ show: false, initial: null });
const confirmState = ref({ show: false, kind: '', payload: null });
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

function openNewOrder() { orderModal.value = { show: true, initial: null }; }
function openEditOrder(o) {
  if (isLocked.value) {
    alertState.value = { show: true, title: '已接單，無法修改', message: '如需修改請聯絡店家', type: 'warn' };
    return;
  }
  orderModal.value = { show: true, initial: o };
}

async function saveOrder(payload) {
  try {
    if (orderModal.value.initial) {
      const id = orderModal.value.initial.id;
      if (useSessionData.value) {
        await updateSessionOrder(id, payload);
      } else {
        await updateOrder(id, payload);
      }
    } else {
      // 新增（限定 open 期間）
      if (!useSessionData.value) return;
      await createSessionOrder({
        sessionId: props.id,
        source: 'organizer',
        ...payload,
      });
    }
    orderModal.value.show = false;
    await syncSessionTotal();
  } catch (e) {
    alertState.value = { show: true, title: '儲存失敗', message: e.message, type: 'error' };
  }
}

function askDeleteOrder(o) {
  if (isLocked.value) return;
  confirmState.value = { show: true, kind: 'delete-order', payload: o };
}

async function togglePaid(o) {
  if (useSessionData.value) {
    await updateSessionOrder(o.id, { paid: !o.paid });
  } else {
    await updateOrder(o.id, { paid: !o.paid });
  }
}

async function syncSessionTotal() {
  if (!useSessionData.value) return;
  const sum = sessionOrders.value.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  await updateSession(props.id, { totalAmount: sum });
}

// ── 狀態流操作 ───────────────────────────────────
function askSubmit() {
  if (!sessionOrders.value.length) {
    alertState.value = { show: true, title: '尚無訂單', message: '至少要有一筆訂購人訂單才能送審', type: 'warn' };
    return;
  }
  confirmState.value = { show: true, kind: 'submit', payload: null };
}
function askRecall() { confirmState.value = { show: true, kind: 'recall', payload: null }; }
function askClose() { confirmState.value = { show: true, kind: 'close', payload: null }; }
function askReopen() { confirmState.value = { show: true, kind: 'reopen', payload: null }; }

async function handleConfirm() {
  const { kind, payload } = confirmState.value;
  confirmState.value = { show: false, kind: '', payload: null };
  try {
    if (kind === 'delete-order') {
      if (useSessionData.value) await deleteSessionOrder(payload.id);
      else await null; // 送審後不可刪
      await syncSessionTotal();
    } else if (kind === 'submit') {
      await doSubmitForReview();
    } else if (kind === 'recall') {
      await doRecall();
    } else if (kind === 'close') {
      await doClose();
    } else if (kind === 'reopen') {
      await doReopen();
    }
  } catch (e) {
    alertState.value = { show: true, title: '操作失敗', message: e.message, type: 'error' };
  }
}

async function doSubmitForReview() {
  const s = session.value;
  const sum = sessionOrders.value.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const groupData = {
    companyName: s.companyName,
    contactName: s.contactName,
    contactPhone: s.contactPhone,
    address: s.address,
    deliveryTime: s.deliveryTime,
    status: 'pending',
    orderType: s.orderType,
    totalAmount: sum,
    resource: '團購人',
    linkedSessionId: s.id,
    organizerUid: s.organizerUid,
    updatedAt: new Date().toISOString(),
  };
  const ordersList = sessionOrders.value.map((o) => ({
    linkedSessionOrderId: o.id,
    customerName: o.customerName,
    customerUnit: o.customerUnit,
    items: o.items || [],
    totalAmount: o.totalAmount || 0,
    note: o.note || '',
    paid: !!o.paid,
    orderType: s.orderType,
  }));
  const groupId = await batchCreateGroupWithOrders(groupData, ordersList);
  await updateSession(s.id, {
    status: SESSION_STATUS.PENDING,
    linkedGroupOrderId: groupId,
    submittedAt: Timestamp.now(),
    totalAmount: sum,
  });
  alertState.value = { show: true, title: '已送出審核', message: '請等候店家審核結果', type: 'success' };
}

async function doRecall() {
  const s = session.value;
  if (s.linkedGroupOrderId) {
    await batchDeleteGroupWithOrders(s.linkedGroupOrderId);
  }
  await updateSession(s.id, {
    status: SESSION_STATUS.OPEN,
    linkedGroupOrderId: '',
    submittedAt: null,
  });
  alertState.value = { show: true, title: '已收回', message: '訂單已從後台收回', type: 'info' };
}

async function doClose() {
  await updateSession(props.id, { status: SESSION_STATUS.CLOSED });
  router.replace('/organizer');
}

async function doReopen() {
  // 拒絕後重新編輯：刪除舊 GroupOrders 與 Orders（若有），回到 open
  const s = session.value;
  if (s.linkedGroupOrderId) {
    await batchDeleteGroupWithOrders(s.linkedGroupOrderId);
  }
  await updateSession(s.id, {
    status: SESSION_STATUS.OPEN,
    linkedGroupOrderId: '',
    rejectedAt: null,
    rejectedReason: '',
  });
}

// ── 分享網址 ────────────────────────────────────
const shareUrl = computed(() => `${window.location.origin}/order/${auth.firebaseUser?.uid}`);
async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    alertState.value = { show: true, title: '已複製', message: '', type: 'success' };
  } catch {
    alertState.value = { show: true, title: '複製失敗', message: shareUrl.value, type: 'warn' };
  }
}

// 明細展開狀態
const expandedRows = ref(new Set());
function toggleExpand(id) {
  const s = new Set(expandedRows.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedRows.value = s;
}

// 單位篩選
const filterUnit = ref('');
const filteredOrders = computed(() => {
  if (!filterUnit.value) return displayedOrders.value;
  return displayedOrders.value.filter((o) => o.customerUnit === filterUnit.value);
});

const confirmInfo = computed(() => {
  switch (confirmState.value.kind) {
    case 'submit': return { title: '送出審核？', message: '送出後將無法新增/刪除訂購人訂單。', confirm: '送出', danger: false };
    case 'recall': return { title: '收回訂單？', message: '後台對應的待審核訂單將被刪除。', confirm: '收回', danger: true };
    case 'close': return { title: '關閉本次開團？', message: '關閉後將無法再新增訂單。', confirm: '關團', danger: true };
    case 'reopen': return { title: '重新編輯？', message: '將清除目前送審紀錄，回到開團中狀態。', confirm: '重新編輯', danger: false };
    case 'delete-order': return { title: '刪除這筆訂單？', message: confirmState.value.payload?.customerName || '', confirm: '刪除', danger: true };
    default: return { title: '', message: '', confirm: '確定', danger: false };
  }
});
</script>

<template>
  <section v-if="!loading && session" class="space-y-4">
    <!-- 關團 / 編輯開團：open 狀態；收回訂單：pending 狀態 -->
    <div class="flex justify-between">
      <div>
        <button v-if="session.status === SESSION_STATUS.OPEN" class="g-btn g-btn-danger" @click="askClose">
          <i class="fas fa-power-off"></i> 關團
        </button>
        <button v-if="session.status === SESSION_STATUS.PENDING" class="g-btn g-btn-danger" @click="askRecall">
          <i class="fas fa-rotate-left"></i> 收回訂單
        </button>
      </div>
      <button v-if="session.status === SESSION_STATUS.OPEN" class="g-btn g-btn-glass" @click="router.push(`/organizer/session/${id}/edit`)">
        <i class="fas fa-pen"></i> 編輯開團
      </button>
    </div>

    <!-- 已拒絕：關團（左）、重新編輯（右） -->
    <div v-if="session.status === SESSION_STATUS.REJECTED" class="flex justify-between">
      <button class="g-btn g-btn-danger g-btn-sm" @click="askClose">
        <i class="fas fa-power-off"></i> 關團
      </button>
      <button class="g-btn g-btn-brand g-btn-sm" @click="askReopen">
        <i class="fas fa-pen-to-square"></i> 重新編輯
      </button>
    </div>

    <!-- 已接單：關團（左）、已接單無法修改（右） -->
    <div v-if="session.status === SESSION_STATUS.APPROVED" class="flex justify-between">
      <button class="g-btn g-btn-danger g-btn-sm" @click="askClose">
        <i class="fas fa-power-off"></i> 關團
      </button>
    </div>

    <!-- Header -->
    <div class="g-card-solid p-4">
      <!-- 公司名稱 + badge -->
      <div class="mb-2">
        <div class="flex items-center justify-between gap-2 min-w-0">
          <h2 class="text-base sm:text-xl font-bold truncate">{{ session.companyName }}</h2>
          <StatusBadge :status="session.status" class="shrink-0 ml-auto" />
        </div>
        <p class="text-sm text-stone-500">{{ session.contactName }} · {{ session.contactPhone }}</p>
      </div>

      <p class="text-sm"><i class="fas fa-truck mr-1"></i>交貨：{{ fmtTs(session.deliveryTime) }}</p>
      <p class="text-sm"><i class="fas fa-cube mr-1"></i>類型：{{ session.orderType === 'vacuum' ? '真空' : '一般' }}</p>
      <p class="text-sm"><i class="fas fa-tags mr-1"></i>單位：{{ (session.units || []).join('、') }}</p>

      <!-- 開團專屬網址 + 複製按鈕並排 -->
      <div v-if="session.status === SESSION_STATUS.OPEN"
           class="g-card p-2 mt-3 flex items-center gap-2">
        <div class="flex-1 min-w-0">
          <p class="g-label mb-1"><i class="fas fa-link mr-1"></i> 開團專屬網址</p>
          <p class="font-mono text-xs break-all">{{ shareUrl }}</p>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm shrink-0" @click="copyShareUrl" title="複製網址">
          <i class="fas fa-copy"></i>
        </button>
      </div>

      <p v-if="session.status === SESSION_STATUS.REJECTED && session.rejectedReason"
         class="text-sm mt-3 text-red-600">拒絕原因：{{ session.rejectedReason }}</p>
    </div>



    <!-- Orders list -->
    <div class="g-card-solid p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold">訂購人列表（{{ filteredOrders.length }}{{ filterUnit ? ` / ${displayedOrders.length}` : '' }}）</h3>
        <button v-if="useSessionData" class="g-btn g-btn-brand g-btn-sm" @click="openNewOrder">
          <i class="fas fa-plus"></i> 新增
        </button>
      </div>

      <!-- 單位篩選 -->
      <div v-if="displayedOrders.length" class="flex flex-wrap gap-2 mb-3">
        <button class="g-badge cursor-pointer transition-colors"
                :class="filterUnit === '' ? 'g-badge-active' : 'g-badge-neutral'"
                @click="filterUnit = ''">全部</button>
        <button v-for="u in (session.units || [])" :key="u"
                class="g-badge cursor-pointer transition-colors"
                :class="filterUnit === u ? 'g-badge-active' : 'g-badge-neutral'"
                @click="filterUnit = u">{{ u }}</button>
      </div>

      <div v-if="!displayedOrders.length" class="text-center py-8 text-stone-400 text-sm">尚無訂購人下單</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-200 text-xs" style="color: var(--text-muted)">
              <th class="py-2 pr-2 text-center whitespace-nowrap w-10">付款</th>
              <th class="py-2 px-2 text-left">姓名</th>
              <th class="py-2 px-2 text-left hidden sm:table-cell">單位</th>
              <th class="py-2 px-2 text-right">金額</th>
              <th class="py-2 pl-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="o in filteredOrders" :key="o.id">
              <!-- 主列 -->
              <tr class="border-b border-stone-100"
                  :class="{}">
                <!-- 付款勾選 -->
                <td class="py-2.5 pr-2 text-center">
                  <input type="checkbox" :checked="o.paid" @change="togglePaid(o)"
                         class="w-4 h-4 accent-brand-500 cursor-pointer" />
                </td>
                <!-- 姓名 + 下拉展開 -->
                <td class="py-2.5 px-2">
                  <button class="flex items-center gap-1 font-bold text-left hover:text-brand-700 transition-colors"
                          @click="toggleExpand(o.id)">
                    <i class="fas text-xs text-stone-400"
                       :class="expandedRows.has(o.id) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                    {{ o.customerName }}
                  </button>
                  <p v-if="o.note" class="text-xs mt-0.5" style="color: var(--text-muted)">{{ o.note }}</p>
                </td>
                <!-- 單位 -->
                <td class="py-2.5 px-2 hidden sm:table-cell">
                  <span class="g-badge g-badge-neutral">{{ o.customerUnit }}</span>
                </td>
                <!-- 金額 -->
                <td class="py-2.5 px-2 text-right font-bold" style="color: var(--brand)">
                  {{ fmtMoney(o.totalAmount) }}
                </td>
                <!-- 操作 -->
                <td class="py-2.5 pl-2 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button v-if="!isLocked && useSessionData"
                            class="g-btn g-btn-glass g-btn-sm w-8 h-8 px-0" @click="openEditOrder(o)">
                      <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button v-if="useSessionData"
                            class="g-btn g-btn-danger g-btn-sm w-8 h-8 px-0" @click="askDeleteOrder(o)">
                      <i class="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <!-- 明細展開列 -->
              <tr v-if="expandedRows.has(o.id)">
                <td></td>
                <td colspan="4" class="py-2 px-2 pb-3">
                  <!-- 手機發首顯示單位（桌機已有單位欄） -->
                  <p class="sm:hidden text-xs mb-1.5 font-medium" style="color: var(--text-secondary)">
                    <i class="fas fa-location-dot mr-1"></i>{{ o.customerUnit }}
                  </p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs" style="color: var(--text-secondary)">
                    <div v-for="(it, i) in o.items || []" :key="i"
                         class="flex gap-2 py-0.5">
                      <span class="flex-1">{{ it.itemName }}</span>
                      <span>×{{ it.qty }}</span>
                      <span class="w-14 text-right">{{ fmtMoney(it.subtotal) }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="border-t border-stone-200 mt-3 pt-3 flex items-center justify-between">
        <div>
          <span class="g-label">已收款 / 總金額</span>
          <p class="text-sm">{{ fmtMoney(paidAmount) }} <span class="text-stone-400">/</span> {{ fmtMoney(totalAmount) }}</p>
        </div>
        <div class="text-right">
          <span class="g-label">總金額</span>
          <p class="text-2xl font-bold text-brand-700">{{ fmtMoney(totalAmount) }}</p>
        </div>
      </div>

    </div>

    <!-- 送出訂單：開團中時顯示於訂單列表 card 下方置中 -->
    <div v-if="session.status === SESSION_STATUS.OPEN" class="flex justify-center">
      <button class="g-btn g-btn-success g-btn-lg" @click="askSubmit">
        <i class="fas fa-paper-plane"></i> 送出訂單
      </button>
    </div>

    <AddOrderModal
      :show="orderModal.show"
      :units="session.units || []"
      :order-type="session.orderType"
      :initial="orderModal.initial"
      @save="saveOrder"
      @close="orderModal.show = false"
    />

    <ConfirmDialog
      :show="confirmState.show"
      :title="confirmInfo.title"
      :message="confirmInfo.message"
      :confirm-text="confirmInfo.confirm"
      :danger="confirmInfo.danger"
      @confirm="handleConfirm"
      @cancel="confirmState.show = false"
    />

    <CustomAlert :show="alertState.show" :title="alertState.title" :message="alertState.message" :type="alertState.type"
                 @close="alertState.show = false" />
  </section>

  <div v-else-if="!loading" class="text-center py-12 text-stone-500">找不到此開團</div>
  <div v-else class="text-center py-12 text-stone-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
</template>
