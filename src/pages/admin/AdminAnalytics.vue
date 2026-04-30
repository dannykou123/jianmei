<script setup>
import { ref, onMounted, computed } from 'vue';
import { listGroupOrders } from '@/services/orders.service';
import { fmtMoney } from '@/composables/useFmt';

const all = ref([]);
const loading = ref(true);

onMounted(async () => {
  all.value = await listGroupOrders();
  loading.value = false;
});

const stats = computed(() => {
  const total = all.value.length;
  const pending = all.value.filter((g) => g.status === 'pending').length;
  const approved = all.value.filter((g) => g.status === 'approved').length;
  const rejected = all.value.filter((g) => g.status === 'rejected').length;
  const totalAmount = all.value
    .filter((g) => g.status === 'approved')
    .reduce((s, g) => s + (Number(g.totalAmount) || 0), 0);
  return { total, pending, approved, rejected, totalAmount };
});
</script>

<template>
  <section>
    <h2 class="text-xl font-bold mb-4">統計（簡版）</h2>
    <div v-if="loading" class="text-center py-12 text-stone-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="g-card-solid p-4">
        <p class="g-label">全部訂單</p>
        <p class="text-2xl font-bold mt-1">{{ stats.total }}</p>
      </div>
      <div class="g-card-solid p-4">
        <p class="g-label">待審核</p>
        <p class="text-2xl font-bold mt-1 text-amber-600">{{ stats.pending }}</p>
      </div>
      <div class="g-card-solid p-4">
        <p class="g-label">已接單</p>
        <p class="text-2xl font-bold mt-1 text-green-600">{{ stats.approved }}</p>
      </div>
      <div class="g-card-solid p-4">
        <p class="g-label">已拒絕</p>
        <p class="text-2xl font-bold mt-1 text-red-600">{{ stats.rejected }}</p>
      </div>
      <div class="g-card-solid p-4 col-span-2 sm:col-span-4">
        <p class="g-label">已接單訂單總金額</p>
        <p class="text-3xl font-bold mt-1 text-brand-700">{{ fmtMoney(stats.totalAmount) }}</p>
      </div>
    </div>
  </section>
</template>
