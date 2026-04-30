<script setup>
import { ref, onMounted, computed } from 'vue';
import { useItemsStore } from '@/stores/useItemsStore';
import { createItem, updateItem, deleteItem } from '@/services/items.service';
import GlassModal from '@/components/GlassModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { fmtMoney } from '@/composables/useFmt';

const store = useItemsStore();
const editor = ref({ show: false, isNew: true, data: null });
const confirmDel = ref({ show: false, item: null });
const filterType = ref('');

const filtered = computed(() => {
  if (!filterType.value) return store.items;
  return store.items.filter((i) => i.type === filterType.value);
});

onMounted(() => store.fetch());

function openNew() {
  editor.value = {
    show: true,
    isNew: true,
    data: { name: '', price: 0, type: 'regular', description: '', isCombo: false, combos: [] },
  };
}
function openEdit(item) {
  editor.value = { show: true, isNew: false, data: { ...item, combos: item.combos ? [...item.combos] : [] } };
}

async function save() {
  const d = editor.value.data;
  if (!d.name) return;
  const payload = {
    name: d.name.trim(),
    price: Number(d.price) || 0,
    type: d.type,
    description: d.description || '',
    isCombo: !!d.isCombo,
    combos: d.isCombo ? (d.combos || []).filter((c) => c.itemName) : [],
  };
  if (editor.value.isNew) {
    payload.createdAt = new Date().toISOString();
    await createItem(payload);
  } else {
    await updateItem(d.id, payload);
  }
  editor.value.show = false;
  await store.fetch(true);
}

async function remove() {
  if (!confirmDel.value.item) return;
  await deleteItem(confirmDel.value.item.id);
  confirmDel.value = { show: false, item: null };
  await store.fetch(true);
}

function addCombo() {
  editor.value.data.combos.push({ itemName: '', qty: 1 });
}
function removeCombo(i) {
  editor.value.data.combos.splice(i, 1);
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <h2 class="text-xl font-bold">商品管理 <span class="text-sm font-normal text-stone-500">({{ filtered.length }})</span></h2>
      <div class="flex gap-2">
        <select v-model="filterType" class="g-select w-32">
          <option value="">全部</option>
          <option value="regular">一般</option>
          <option value="vacuum">真空</option>
        </select>
        <button class="g-btn g-btn-brand g-btn-sm" @click="openNew"><i class="fas fa-plus"></i> 新增商品</button>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-stone-500">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
    </div>
    <div v-else-if="!filtered.length" class="g-card-solid p-8 text-center text-stone-500">尚無商品</div>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <div v-for="it in filtered" :key="it.id" class="g-card-solid p-3 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ it.name }}</span>
            <span class="g-badge g-badge-neutral">{{ it.type === 'vacuum' ? '真空' : '一般' }}</span>
            <span v-if="it.isCombo" class="g-badge g-badge-info">綜合</span>
          </div>
          <p v-if="it.description" class="text-xs text-stone-500 truncate">{{ it.description }}</p>
        </div>
        <div class="font-bold text-brand-700">{{ fmtMoney(it.price) }}</div>
        <button class="g-btn g-btn-glass g-btn-sm" @click="openEdit(it)"><i class="fas fa-pen"></i></button>
        <button class="g-btn g-btn-danger g-btn-sm" @click="confirmDel = { show: true, item: it }"><i class="fas fa-trash"></i></button>
      </div>
    </div>

    <GlassModal :show="editor.show" :title="editor.isNew ? '新增商品' : '編輯商品'" @close="editor.show = false">
      <div v-if="editor.data" class="space-y-3">
        <div>
          <label class="g-label block mb-1">品名</label>
          <input v-model="editor.data.name" class="g-input" placeholder="商品名稱" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="g-label block mb-1">單價</label>
            <input v-model.number="editor.data.price" type="number" min="0" class="g-input" />
          </div>
          <div>
            <label class="g-label block mb-1">類型</label>
            <select v-model="editor.data.type" class="g-select">
              <option value="regular">一般</option>
              <option value="vacuum">真空</option>
            </select>
          </div>
        </div>
        <div>
          <label class="g-label block mb-1">說明（選填）</label>
          <textarea v-model="editor.data.description" class="g-input" rows="2"></textarea>
        </div>
        <div>
          <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="editor.data.isCombo" /> 綜合商品（內容物）</label>
        </div>
        <div v-if="editor.data.isCombo" class="space-y-2">
          <div v-for="(c, i) in editor.data.combos" :key="i" class="flex gap-2">
            <input v-model="c.itemName" class="g-input flex-1" placeholder="內容物品名" />
            <input v-model.number="c.qty" type="number" min="1" class="g-input w-24" />
            <button class="g-btn g-btn-danger g-btn-sm" @click="removeCombo(i)"><i class="fas fa-xmark"></i></button>
          </div>
          <button class="g-btn g-btn-glass g-btn-sm" @click="addCombo"><i class="fas fa-plus"></i> 新增內容物</button>
        </div>
      </div>
      <template #footer>
        <button class="g-btn g-btn-glass" @click="editor.show = false">取消</button>
        <button class="g-btn g-btn-brand" @click="save">儲存</button>
      </template>
    </GlassModal>

    <ConfirmDialog
      :show="confirmDel.show"
      title="刪除商品？"
      :message="confirmDel.item?.name || ''"
      confirm-text="刪除" danger
      @confirm="remove"
      @cancel="confirmDel = { show: false, item: null }"
    />
  </section>
</template>
