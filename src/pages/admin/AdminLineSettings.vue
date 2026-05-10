<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminAuth } from '@/stores/useAdminAuth';
import { subscribeGroupOrders } from '@/services/orders.service';
import CustomAlert from '@/components/CustomAlert.vue';
import {
  DELIVERY_STATUSES,
  DEFAULT_TEMPLATES,
  getNotificationTemplates,
  saveNotificationTemplate,
  updateDeliveryStatus,
  getDeliveryStatusHistory,
} from '@/services/line.service';

const auth = useAdminAuth();
const alertState = ref({ show: false, title: '', message: '', type: 'info' });
const activeTab = ref('templates'); // 'templates' | 'delivery'

// ── 通知範本 ──────────────────────────────────────────────────────────
const templates = ref({});
const templateSaving = ref('');
const loadingTemplates = ref(true);

onMounted(async () => {
  const saved = await getNotificationTemplates();
  DELIVERY_STATUSES.forEach(({ value }) => {
    templates.value[value] = saved[value] || DEFAULT_TEMPLATES[value] || '';
  });
  loadingTemplates.value = false;
});

async function saveTemplate(status) {
  templateSaving.value = status;
  try {
    await saveNotificationTemplate(status, templates.value[status]);
    showAlert('已儲存', `${statusLabel(status)} 通知範本已更新`, 'success');
  } catch (e) {
    showAlert('儲存失敗', e.message, 'error');
  } finally {
    templateSaving.value = '';
  }
}

function resetTemplate(status) {
  templates.value[status] = DEFAULT_TEMPLATES[status] || '';
}

// ── 配送狀態管理 ──────────────────────────────────────────────────────
const orders = ref([]);
const loadingOrders = ref(true);
const selectedOrderId = ref('');
const deliveryForm = ref({ status: '', estimatedDeliveryDate: '', note: '', shouldNotify: true });
const updatingStatus = ref(false);
const statusHistory = ref([]);
const loadingHistory = ref(false);
const searchQuery = ref('');

let unsub = null;
onMounted(() => {
  unsub = subscribeGroupOrders((list) => {
    orders.value = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    loadingOrders.value = false;
  });
});

const filteredOrders = computed(() => {
  if (!searchQuery.value.trim()) return orders.value;
  const q = searchQuery.value.toLowerCase();
  return orders.value.filter(
    (o) =>
      o.id?.toLowerCase().includes(q) ||
      o.organizerName?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
  );
});

async function selectOrder(orderId) {
  selectedOrderId.value = orderId;
  deliveryForm.value = { status: '', estimatedDeliveryDate: '', note: '', shouldNotify: true };
  statusHistory.value = [];
  loadingHistory.value = true;
  try {
    statusHistory.value = await getDeliveryStatusHistory(orderId);
  } finally {
    loadingHistory.value = false;
  }
}

async function submitDeliveryUpdate() {
  if (!selectedOrderId.value || !deliveryForm.value.status) {
    showAlert('請選擇狀態', '請先選擇配送狀態', 'warn');
    return;
  }
  updatingStatus.value = true;
  try {
    const result = await updateDeliveryStatus({
      groupOrderId: selectedOrderId.value,
      ...deliveryForm.value,
    });
    const noticeMsg = result.notified
      ? '已同步發送 LINE 通知給團購主'
      : result.reason
        ? `LINE 通知未發送：${result.reason}`
        : '（未觸發 LINE 通知）';
    showAlert('配送狀態已更新', noticeMsg, 'success');
    statusHistory.value = await getDeliveryStatusHistory(selectedOrderId.value);
    deliveryForm.value = { status: '', estimatedDeliveryDate: '', note: '', shouldNotify: true };
  } catch (e) {
    showAlert('更新失敗', e.message, 'error');
  } finally {
    updatingStatus.value = false;
  }
}

// ── 工具 ─────────────────────────────────────────────────────────────
function statusLabel(v) {
  return DELIVERY_STATUSES.find((s) => s.value === v)?.label || v;
}
function statusIcon(v) {
  return DELIVERY_STATUSES.find((s) => s.value === v)?.icon || 'fa-circle';
}
function statusColor(v) {
  return DELIVERY_STATUSES.find((s) => s.value === v)?.color || 'currentColor';
}
function fmtTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function showAlert(title, message, type = 'info') {
  alertState.value = { show: true, title, message, type };
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h2 class="text-xl font-bold">
        <i class="fab fa-line mr-2" style="color: #06C755"></i>LINE 通知設定
      </h2>
      <div class="flex gap-2">
        <button
          class="g-btn g-btn-sm"
          :class="activeTab === 'templates' ? 'g-btn-brand' : 'g-btn-glass'"
          @click="activeTab = 'templates'"
        >
          <i class="fas fa-file-alt"></i> 通知範本
        </button>
        <button
          class="g-btn g-btn-sm"
          :class="activeTab === 'delivery' ? 'g-btn-brand' : 'g-btn-glass'"
          @click="activeTab = 'delivery'"
        >
          <i class="fas fa-truck"></i> 配送狀態
        </button>
      </div>
    </div>

    <!-- ── Tab 1: 通知範本 ───────────────────────────────────────── -->
    <div v-if="activeTab === 'templates'" class="space-y-4">
      <p class="text-sm" style="color: var(--text-secondary)">
        可用變數：<code class="g-badge">&#123;&#123;用戶姓名&#125;&#125;</code>
        <code class="g-badge ml-1">&#123;&#123;預計送貨日&#125;&#125;</code>
        <code class="g-badge ml-1">&#123;&#123;備註&#125;&#125;</code>
      </p>

      <div v-if="loadingTemplates" class="text-center py-8 text-stone-400">
        <i class="fas fa-spinner fa-spin"></i>
      </div>

      <div v-else v-for="s in DELIVERY_STATUSES" :key="s.value" class="g-card-solid p-4 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-bold flex items-center gap-2">
            <i :class="['fas', s.icon]" :style="{ color: s.color }"></i>{{ s.label }}
          </span>
          <div class="flex gap-2">
            <button class="g-btn g-btn-glass g-btn-sm" @click="resetTemplate(s.value)" title="還原預設">
              <i class="fas fa-rotate-left"></i>
            </button>
            <button
              class="g-btn g-btn-brand g-btn-sm"
              :disabled="templateSaving === s.value"
              @click="saveTemplate(s.value)"
            >
              <i class="fas fa-floppy-disk"></i>
              {{ templateSaving === s.value ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </div>
        <textarea
          v-model="templates[s.value]"
          class="g-input font-mono text-xs"
          rows="4"
          :placeholder="DEFAULT_TEMPLATES[s.value]"
        ></textarea>
      </div>
    </div>

    <!-- ── Tab 2: 配送狀態管理 ────────────────────────────────────── -->
    <div v-if="activeTab === 'delivery'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- 訂單列表 -->
        <div class="g-card-solid p-4 space-y-3">
          <h3 class="font-bold text-sm">選擇訂單</h3>
          <input v-model="searchQuery" class="g-input" placeholder="搜尋訂單 ID 或團購主姓名…" />

          <div v-if="loadingOrders" class="text-center py-4 text-stone-400">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="o in filteredOrders"
              :key="o.id"
              class="p-3 rounded-xl cursor-pointer transition-all"
              :class="selectedOrderId === o.id
                ? 'ring-2 ring-brand'
                : 'hover:opacity-80'"
              style="background: var(--surface-2)"
              @click="selectOrder(o.id)"
            >
              <p class="font-medium text-sm truncate">{{ o.organizerName || o.id }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs" style="color: var(--text-secondary)">
                  {{ o.status }}
                </span>
                <span v-if="o.currentDeliveryStatus" class="text-xs font-medium flex items-center gap-1"
                      style="color: var(--brand)">
                  <i class="fas fa-arrow-right text-xs"></i>
                  <i :class="['fas', statusIcon(o.currentDeliveryStatus)]"
                     :style="{ color: statusColor(o.currentDeliveryStatus) }"></i>
                  {{ statusLabel(o.currentDeliveryStatus) }}
                </span>
              </div>
            </div>
            <p v-if="filteredOrders.length === 0" class="text-center text-stone-400 text-sm py-4">
              無符合條件的訂單
            </p>
          </div>
        </div>

        <!-- 更新表單 -->
        <div class="space-y-4">
          <div class="g-card-solid p-4 space-y-3" :class="{ 'opacity-50 pointer-events-none': !selectedOrderId }">
            <h3 class="font-bold text-sm">
              更新配送狀態
              <span v-if="selectedOrderId" class="font-normal text-xs ml-2" style="color: var(--text-secondary)">
                {{ selectedOrderId.slice(0, 8) }}…
              </span>
            </h3>

            <div>
              <label class="g-label block mb-1">配送狀態 *</label>
              <select v-model="deliveryForm.status" class="g-input">
                <option value="">— 請選擇 —</option>
                <option v-for="s in DELIVERY_STATUSES" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="g-label block mb-1">預計送達日期</label>
              <input v-model="deliveryForm.estimatedDeliveryDate" type="date" class="g-input" />
            </div>

            <div>
              <label class="g-label block mb-1">備註（異常說明等）</label>
              <textarea v-model="deliveryForm.note" class="g-input" rows="2" placeholder="選填"></textarea>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="deliveryForm.shouldNotify" class="w-4 h-4 accent-brand" />
              <span class="text-sm">同步發送 LINE 通知給團購主</span>
            </label>

            <button
              class="g-btn g-btn-brand g-btn-lg w-full"
              :disabled="updatingStatus || !selectedOrderId"
              @click="submitDeliveryUpdate"
            >
              <i class="fas fa-paper-plane"></i>
              {{ updatingStatus ? '更新中...' : '確認更新' }}
            </button>
          </div>

          <!-- 狀態歷史 -->
          <div v-if="selectedOrderId" class="g-card-solid p-4 space-y-2">
            <h3 class="font-bold text-sm">配送歷史</h3>
            <div v-if="loadingHistory" class="text-center text-stone-400 py-3">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div v-else-if="statusHistory.length === 0" class="text-sm text-stone-400">尚無配送記錄</div>
            <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
              <div v-for="h in statusHistory" :key="h.id"
                   class="flex items-start gap-2 text-sm p-2 rounded-lg"
                   style="background: var(--surface-2)">
                <i :class="['fas', statusIcon(h.status)]"
                   :style="{ color: statusColor(h.status) }"></i>
                <div class="flex-1 min-w-0">
                  <p class="font-medium">{{ statusLabel(h.status) }}</p>
                  <p v-if="h.note" class="text-xs truncate" style="color: var(--text-secondary)">
                    {{ h.note }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs" style="color: var(--text-secondary)">
                      {{ fmtTime(h.createdAt) }}
                    </span>
                    <span v-if="h.notificationTriggered"
                          class="text-xs font-medium" style="color: #06C755">
                      <i class="fab fa-line"></i> 已通知
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CustomAlert
      :show="alertState.show"
      :title="alertState.title"
      :message="alertState.message"
      :type="alertState.type"
      @close="alertState.show = false"
    />
  </section>
</template>
