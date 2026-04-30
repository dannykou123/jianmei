<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useItemsStore } from '@/stores/useItemsStore';
import { fmtMoney } from '@/composables/useFmt';
import GlassModal from '@/components/GlassModal.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  units: { type: Array, default: () => [] },
  orderType: { type: String, default: 'regular' },
  initial: { type: Object, default: null }, // 編輯時傳入
});
const emit = defineEmits(['save', 'close']);

const store = useItemsStore();
const customerName = ref('');
const customerUnit = ref('');
const note = ref('');
const qtyMap = ref({}); // itemId → qty

const items = computed(() => store.byType(props.orderType));

const totalAmount = computed(() => {
  return items.value.reduce((sum, it) => {
    const q = Number(qtyMap.value[it.id] || 0);
    return sum + q * (Number(it.price) || 0);
  }, 0);
});

watch(() => props.show, async (s) => {
  if (s) {
    await store.fetch();
    if (props.initial) {
      customerName.value = props.initial.customerName || '';
      customerUnit.value = props.initial.customerUnit || (props.units[0] || '');
      note.value = props.initial.note || '';
      qtyMap.value = {};
      (props.initial.items || []).forEach((line) => {
        const found = store.items.find((x) => x.name === line.itemName);
        if (found) qtyMap.value[found.id] = line.qty;
      });
    } else {
      customerName.value = '';
      customerUnit.value = props.units[0] || '';
      note.value = '';
      qtyMap.value = {};
    }
  }
});

function buildItems() {
  return items.value
    .filter((it) => Number(qtyMap.value[it.id] || 0) > 0)
    .map((it) => {
      const q = Number(qtyMap.value[it.id]);
      const p = Number(it.price) || 0;
      return { itemName: it.name, qty: q, price: p, subtotal: q * p };
    });
}

function submit() {
  if (!customerName.value.trim()) return;
  if (!customerUnit.value) return;
  const lines = buildItems();
  if (!lines.length) return;
  emit('save', {
    customerName: customerName.value.trim(),
    customerUnit: customerUnit.value,
    items: lines,
    note: note.value || '',
    totalAmount: totalAmount.value,
  });
}
</script>

<template>
  <GlassModal :show="show" :title="initial ? '編輯訂單' : '新增訂購人訂單'" @close="emit('close')">
    <!-- flex-col h-full 讓商品列表可撐滿 modal body 剩餘空間 -->
    <div class="flex flex-col h-full gap-3">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="g-label block mb-1">姓名 *</label><input v-model="customerName" class="g-input" /></div>
        <div>
          <label class="g-label block mb-1">單位 *</label>
          <select v-model="customerUnit" class="g-select">
            <option value="" disabled>請選擇</option>
            <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>
      </div>

      <!-- 商品列表：flex-1 min-h-0 讓此區塊吸收剩餘空間 -->
      <div class="flex flex-col flex-1 min-h-0">
        <label class="g-label block mb-1">商品（{{ orderType === 'vacuum' ? '真空' : '一般' }}）</label>
        <div class="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
          <div v-for="it in items" :key="it.id" class="g-card p-2 flex items-center gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm truncate">{{ it.name }}</p>
              <p class="text-xs text-stone-500">{{ fmtMoney(it.price) }}</p>
            </div>
            <!-- +/- 加減按鈕 -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button type="button" class="g-btn g-btn-glass g-btn-sm w-8 px-0"
                      style="height:2rem"
                      @click="qtyMap[it.id] = Math.max(0, Number(qtyMap[it.id] || 0) - 1)">
                <i class="fas fa-minus text-xs"></i>
              </button>
              <div class="w-12">
                <input v-model.number="qtyMap[it.id]" type="number" min="0"
                       class="g-input text-center appearance-none"
                       style="height:2rem;font-size:14px" />
              </div>
              <button type="button" class="g-btn g-btn-glass g-btn-sm w-8 px-0"
                      style="height:2rem"
                      @click="qtyMap[it.id] = Number(qtyMap[it.id] || 0) + 1">
                <i class="fas fa-plus text-xs"></i>
              </button>
            </div>
          </div>
          <div v-if="!items.length" class="text-stone-400 text-sm text-center py-4">尚無商品（請至後台新增）</div>
        </div>
      </div>

      <div><label class="g-label block mb-1">備註</label><textarea v-model="note" class="g-input" rows="2"></textarea></div>
      <div class="flex items-center justify-between border-t border-stone-200 pt-3">
        <span class="g-label">總金額</span>
        <span class="text-2xl font-bold text-brand-700">{{ fmtMoney(totalAmount) }}</span>
      </div>
    </div>
    <template #footer>
      <button class="g-btn g-btn-glass" @click="emit('close')">取消</button>
      <button class="g-btn g-btn-brand" @click="submit">儲存</button>
    </template>
  </GlassModal>
</template>
