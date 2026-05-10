<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  listGroupOrders, listOrdersByGroup, updateGroupOrder, batchDeleteGroupWithOrders,
} from '@/services/orders.service';
import { fmtTs, fmtMoney } from '@/composables/useFmt';
import StatusBadge from '@/components/StatusBadge.vue';
import GlassModal from '@/components/GlassModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DateRangePicker from '@/components/DateRangePicker.vue';

const all = ref([]);
const loading = ref(true);
const search = ref('');
const statusFilter = ref('');
const dateRange = ref({ start: null, end: null });
const detailModal = ref({ show: false, group: null, orders: [] });
const confirmDel = ref({ show: false, group: null });

async function load() {
  loading.value = true;
  all.value = await listGroupOrders();
  loading.value = false;
}
onMounted(load);

const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase();
  const { start, end } = dateRange.value;
  const startMs = start ? new Date(start + 'T00:00:00').getTime() : null;
  const endMs   = end   ? new Date(end   + 'T23:59:59').getTime() : null;

  return all.value
    .filter((g) => !statusFilter.value || g.status === statusFilter.value)
    .filter((g) => {
      if (!kw) return true;
      return [g.companyName, g.contactName, g.contactPhone, g.address]
        .filter(Boolean).some((s) => String(s).toLowerCase().includes(kw));
    })
    .filter((g) => {
      if (!startMs && !endMs) return true;
      const ts = g.createdAt?.seconds ? g.createdAt.seconds * 1000
               : g.createdAt ? new Date(g.createdAt).getTime() : 0;
      if (startMs && ts < startMs) return false;
      if (endMs   && ts > endMs)   return false;
      return true;
    })
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
});

const hasFilter = computed(() =>
  search.value.trim() || statusFilter.value || dateRange.value.start
);

function clearAll() {
  search.value = '';
  statusFilter.value = '';
  dateRange.value = { start: null, end: null };
}

// ── 詳細 Modal ────────────────────────────────────────────────
async function openDetail(g) {
  const orders = await listOrdersByGroup(g.id);
  detailModal.value = { show: true, group: g, orders };
}

// ── 刪除 ──────────────────────────────────────────────────────
async function deleteGroup() {
  if (!confirmDel.value.group) return;
  await batchDeleteGroupWithOrders(confirmDel.value.group.id);
  confirmDel.value = { show: false, group: null };
  await load();
}

// ── 列印全部訂單 ───────────────────────────────────────────────
const STATUS_LABELS = {
  pending: '待審核', approved: '已接單', rejected: '已拒絕', expired: '已過期',
};

function printOrders() {
  const data = filtered.value;
  const rows = data.map((g) => `
    <tr>
      <td>${g.companyName || '—'}</td>
      <td>${g.contactName || '—'}</td>
      <td>${g.contactPhone || '—'}</td>
      <td>${fmtTs(g.deliveryTime)}</td>
      <td class="status-${g.status}">${STATUS_LABELS[g.status] || g.status}</td>
      <td style="text-align:right;font-weight:700">${fmtMoney(g.totalAmount)}</td>
    </tr>`).join('');

  const filterDesc = [
    search.value.trim() ? `搜尋：${search.value}` : '',
    statusFilter.value ? `狀態：${STATUS_LABELS[statusFilter.value]}` : '',
    dateRange.value.start ? `日期：${dateRange.value.start}${dateRange.value.end ? ` ~ ${dateRange.value.end}` : ' 起'}` : '',
  ].filter(Boolean).join('　');

  const w = window.open('', '_blank', 'width=960,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>健美滷味 訂單明細</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;color:#2d2d2d;font-size:13px}
    h2{margin:0 0 4px;font-size:18px}
    .meta{color:#888;font-size:12px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    th{background:#f5f0eb;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e0d8d0}
    td{padding:9px 12px;border-bottom:1px solid #ede8e3}
    tr:nth-child(even) td{background:#faf8f5}
    .status-approved{color:#4A7D58;font-weight:700}
    .status-pending{color:#8B7340;font-weight:700}
    .status-rejected{color:#A85555;font-weight:700}
    .footer{margin-top:24px;font-size:11px;color:#aaa;text-align:right}
    @media print{body{padding:10mm}}
  </style></head><body>
  <h2>健美滷味 — 訂單明細</h2>
  <p class="meta">列印時間：${new Date().toLocaleString('zh-TW')}　共 ${data.length} 筆${filterDesc ? '　' + filterDesc : ''}</p>
  <table>
    <thead><tr>
      <th>公司／單位</th><th>聯絡人</th><th>電話</th>
      <th>交貨時間</th><th>狀態</th><th style="text-align:right">金額</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">健美滷味 團購管理系統</div>
  </body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 350);
}
</script>

<template>
  <section class="space-y-4">

    <!-- ── 頁頭 ───────────────────────────────────────────────── -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold">訂單明細</h2>
        <span class="g-badge g-badge-neutral text-xs">{{ filtered.length }} 筆</span>
      </div>
      <button class="g-btn g-btn-glass g-btn-sm" @click="load">
        <i class="fas fa-rotate"></i> 重新整理
      </button>
    </div>

    <!-- ── 搜尋列 ─────────────────────────────────────────────── -->
    <div class="g-card-solid p-3 space-y-2">
      <!-- Row 1: 關鍵字 + 列印 -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-sm"
             style="color: var(--text-muted)"></i>
          <input v-model="search" class="g-input pl-9"
                 placeholder="搜尋公司、聯絡人、電話、地址…" />
        </div>
        <button class="g-btn g-btn-glass g-btn-sm whitespace-nowrap" @click="printOrders"
                :disabled="!filtered.length" title="列印目前篩選結果">
          <i class="fas fa-print"></i>
          <span class="hidden sm:inline">列印全部訂單</span>
        </button>
      </div>

      <!-- Row 2: 狀態篩選 + 日期篩選 + 清除 -->
      <div class="flex gap-2 flex-wrap items-center">
        <select v-model="statusFilter" class="g-select" style="height:38px;font-size:14px;width:auto;min-width:120px">
          <option value="">所有狀態</option>
          <option value="pending">待審核</option>
          <option value="approved">已接單</option>
          <option value="rejected">已拒絕</option>
          <option value="expired">已過期</option>
        </select>

        <DateRangePicker v-model="dateRange" />

        <button v-if="hasFilter"
                class="g-btn g-btn-glass g-btn-sm"
                style="color: var(--text-muted)"
                @click="clearAll">
          <i class="fas fa-xmark"></i> 清除全部
        </button>
      </div>
    </div>

    <!-- ── 列表 ───────────────────────────────────────────────── -->
    <div v-if="loading" class="text-center py-12" style="color: var(--text-muted)">
      <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>
      <p class="text-sm">載入中…</p>
    </div>

    <div v-else-if="!filtered.length" class="g-card-solid p-10 text-center">
      <i class="fas fa-inbox text-4xl mb-3 block" style="color: var(--text-muted)"></i>
      <p class="font-medium" style="color: var(--text-secondary)">沒有符合條件的訂單</p>
      <button v-if="hasFilter" class="g-btn g-btn-glass g-btn-sm mt-3" @click="clearAll">
        清除篩選
      </button>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="g in filtered" :key="g.id"
        class="g-card p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <span class="font-bold truncate">{{ g.companyName }}</span>
            <StatusBadge :status="g.status" />
          </div>
          <p class="text-xs truncate" style="color: var(--text-secondary)">
            {{ g.contactName }}
            <span class="mx-1">·</span>
            <i class="fas fa-truck"></i> {{ fmtTs(g.deliveryTime) }}
          </p>
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold" style="color: var(--brand)">{{ fmtMoney(g.totalAmount) }}</div>
          <div class="text-xs" style="color: var(--text-muted)">{{ fmtTs(g.createdAt) }}</div>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm" @click="openDetail(g)">
          <i class="fas fa-eye"></i>
        </button>
        <button class="g-btn g-btn-danger g-btn-sm"
                @click="confirmDel = { show: true, group: g }">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- ── 詳細 Modal ──────────────────────────────────────────── -->
    <GlassModal :show="detailModal.show"
                :title="detailModal.group?.companyName || ''"
                @close="detailModal.show = false">
      <div v-if="detailModal.group" class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="g-label block mb-1">狀態</span>
            <StatusBadge :status="detailModal.group.status" />
          </div>
          <div><span class="g-label block mb-1">類型</span>{{ detailModal.group.orderType === 'vacuum' ? '真空' : '一般' }}</div>
          <div><span class="g-label block mb-1">聯絡人</span>{{ detailModal.group.contactName }}</div>
          <div><span class="g-label block mb-1">電話</span>{{ detailModal.group.contactPhone }}</div>
          <div class="col-span-2"><span class="g-label block mb-1">地址</span>{{ detailModal.group.address }}</div>
          <div><span class="g-label block mb-1">交貨時間</span>{{ fmtTs(detailModal.group.deliveryTime) }}</div>
          <div><span class="g-label block mb-1">總金額</span><span class="font-bold" style="color:var(--brand)">{{ fmtMoney(detailModal.group.totalAmount) }}</span></div>
        </div>
        <div>
          <h4 class="font-bold mb-2">訂購人列表（{{ detailModal.orders.length }}）</h4>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div v-for="o in detailModal.orders" :key="o.id" class="g-card p-3">
              <div class="flex justify-between mb-1">
                <span class="font-bold">{{ o.customerName }}
                  <span class="text-xs font-normal" style="color:var(--text-secondary)">{{ o.customerUnit }}</span>
                </span>
                <span class="font-bold" style="color:var(--brand)">{{ fmtMoney(o.totalAmount) }}</span>
              </div>
              <ul class="text-sm space-y-0.5" style="color:var(--text-secondary)">
                <li v-for="(it, i) in o.items || []" :key="i">
                  {{ it.itemName }} × {{ it.qty }} = {{ fmtMoney(it.subtotal) }}
                </li>
              </ul>
              <p v-if="o.note" class="text-xs mt-1" style="color:var(--text-muted)">
                <i class="fas fa-note-sticky mr-1"></i>{{ o.note }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>

    <!-- ── 刪除確認 ─────────────────────────────────────────────── -->
    <ConfirmDialog
      :show="confirmDel.show"
      title="刪除整筆訂單？"
      :message="`此操作無法復原，將刪除「${confirmDel.group?.companyName || ''}」及其下所有訂購人。`"
      confirm-text="刪除"
      danger
      @confirm="deleteGroup"
      @cancel="confirmDel = { show: false, group: null }"
    />
  </section>
</template>
