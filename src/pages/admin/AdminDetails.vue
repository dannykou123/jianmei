<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  listGroupOrders, listOrdersByGroup, updateGroupOrder, batchDeleteGroupWithOrders,
} from '@/services/orders.service';
import { fmtTs, fmtMoney } from '@/composables/useFmt';
import StatusBadge from '@/components/StatusBadge.vue';
import GlassModal from '@/components/GlassModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const all = ref([]);
const loading = ref(true);
const search = ref('');
const statusFilter = ref('');
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
  return all.value
    .filter((g) => !statusFilter.value || g.status === statusFilter.value)
    .filter((g) => {
      if (!kw) return true;
      return [g.companyName, g.contactName, g.contactPhone, g.address]
        .filter(Boolean).some((s) => String(s).toLowerCase().includes(kw));
    })
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
});

async function openDetail(g) {
  const orders = await listOrdersByGroup(g.id);
  detailModal.value = { show: true, group: g, orders };
}

async function deleteGroup() {
  if (!confirmDel.value.group) return;
  await batchDeleteGroupWithOrders(confirmDel.value.group.id);
  confirmDel.value = { show: false, group: null };
  await load();
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <h2 class="text-xl font-bold">訂單明細 <span class="text-sm font-normal text-stone-500">({{ filtered.length }})</span></h2>
      <button class="g-btn g-btn-glass g-btn-sm" @click="load"><i class="fas fa-rotate"></i> 重新整理</button>
    </div>
    <div class="flex gap-2 mb-4 flex-wrap">
      <input v-model="search" class="g-input flex-1 min-w-[200px]" placeholder="搜尋公司／聯絡人／電話／地址" />
      <select v-model="statusFilter" class="g-select w-40">
        <option value="">所有狀態</option>
        <option value="pending">待審核</option>
        <option value="approved">已接單</option>
        <option value="rejected">已拒絕</option>
        <option value="expired">已過期</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-12 text-stone-500">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
    </div>
    <div v-else-if="!filtered.length" class="g-card-solid p-8 text-center text-stone-500">
      <i class="fas fa-inbox text-4xl mb-2"></i><p>沒有符合條件的訂單</p>
    </div>
    <div v-else class="space-y-2">
      <div v-for="g in filtered" :key="g.id" class="g-card-solid p-3 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold truncate">{{ g.companyName }}</span>
            <StatusBadge :status="g.status" />
          </div>
          <p class="text-xs text-stone-500 truncate">{{ g.contactName }} · {{ fmtTs(g.deliveryTime) }}</p>
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold text-brand-700">{{ fmtMoney(g.totalAmount) }}</div>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm" @click="openDetail(g)"><i class="fas fa-eye"></i></button>
        <button class="g-btn g-btn-danger g-btn-sm" @click="confirmDel = { show: true, group: g }">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <GlassModal :show="detailModal.show" :title="detailModal.group?.companyName || ''" @close="detailModal.show = false">
      <div v-if="detailModal.group" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="g-label block mb-1">狀態</span><StatusBadge :status="detailModal.group.status" /></div>
          <div><span class="g-label block mb-1">類型</span>{{ detailModal.group.orderType === 'vacuum' ? '真空' : '一般' }}</div>
          <div><span class="g-label block mb-1">聯絡人</span>{{ detailModal.group.contactName }}</div>
          <div><span class="g-label block mb-1">電話</span>{{ detailModal.group.contactPhone }}</div>
          <div class="col-span-2"><span class="g-label block mb-1">地址</span>{{ detailModal.group.address }}</div>
          <div><span class="g-label block mb-1">交貨</span>{{ fmtTs(detailModal.group.deliveryTime) }}</div>
          <div><span class="g-label block mb-1">總金額</span>{{ fmtMoney(detailModal.group.totalAmount) }}</div>
        </div>
        <div>
          <h4 class="font-bold mb-2">訂購人列表（{{ detailModal.orders.length }}）</h4>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div v-for="o in detailModal.orders" :key="o.id" class="g-card p-3">
              <div class="flex justify-between"><span class="font-bold">{{ o.customerName }} <span class="text-xs text-stone-500">{{ o.customerUnit }}</span></span><span class="font-bold text-brand-700">{{ fmtMoney(o.totalAmount) }}</span></div>
              <ul class="text-sm text-stone-600 mt-1 space-y-1">
                <li v-for="(it, i) in o.items || []" :key="i">{{ it.itemName }} × {{ it.qty }} = {{ fmtMoney(it.subtotal) }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>

    <ConfirmDialog
      :show="confirmDel.show"
      title="刪除整筆訂單？"
      :message="`此操作無法復原，將刪除 ${confirmDel.group?.companyName || ''} 及其下所有訂購人。`"
      confirm-text="刪除"
      danger
      @confirm="deleteGroup"
      @cancel="confirmDel = { show: false, group: null }"
    />
  </section>
</template>
