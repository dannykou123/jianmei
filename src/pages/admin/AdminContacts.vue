<script setup>
import { ref, onMounted } from 'vue';
import { listContacts, createContact, updateContact, deleteContact } from '@/services/contacts.service';
import GlassModal from '@/components/GlassModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const list = ref([]);
const loading = ref(true);
const editor = ref({ show: false, isNew: true, data: null });
const confirmDel = ref({ show: false, c: null });

async function load() {
  loading.value = true;
  list.value = await listContacts();
  loading.value = false;
}
onMounted(load);

function openNew() {
  editor.value = { show: true, isNew: true, data: { companyName: '', contactName: '', contactPhone: '', address: '' } };
}
function openEdit(c) {
  editor.value = { show: true, isNew: false, data: { ...c } };
}

async function save() {
  const d = editor.value.data;
  if (!d.companyName) return;
  const payload = {
    companyName: d.companyName,
    contactName: d.contactName || '',
    contactPhone: d.contactPhone || '',
    address: d.address || '',
  };
  if (editor.value.isNew) await createContact(payload);
  else await updateContact(d.id, payload);
  editor.value.show = false;
  await load();
}

async function remove() {
  await deleteContact(confirmDel.value.c.id);
  confirmDel.value = { show: false, c: null };
  await load();
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">常用聯絡人 ({{ list.length }})</h2>
      <button class="g-btn g-btn-brand g-btn-sm" @click="openNew"><i class="fas fa-plus"></i> 新增</button>
    </div>
    <div v-if="loading" class="text-center py-12 text-stone-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
    <div v-else-if="!list.length" class="g-card-solid p-8 text-center text-stone-500">尚無聯絡人</div>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <div v-for="c in list" :key="c.id" class="g-card-solid p-3 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="font-bold truncate">{{ c.companyName }}</div>
          <p class="text-xs text-stone-500 truncate">{{ c.contactName }} · {{ c.contactPhone }}</p>
          <p class="text-xs text-stone-500 truncate">{{ c.address }}</p>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm" @click="openEdit(c)"><i class="fas fa-pen"></i></button>
        <button class="g-btn g-btn-danger g-btn-sm" @click="confirmDel = { show: true, c }"><i class="fas fa-trash"></i></button>
      </div>
    </div>

    <GlassModal :show="editor.show" :title="editor.isNew ? '新增聯絡人' : '編輯聯絡人'" @close="editor.show = false">
      <div v-if="editor.data" class="space-y-3">
        <div><label class="g-label block mb-1">公司／單位</label><input v-model="editor.data.companyName" class="g-input" /></div>
        <div><label class="g-label block mb-1">聯絡人</label><input v-model="editor.data.contactName" class="g-input" /></div>
        <div><label class="g-label block mb-1">電話</label><input v-model="editor.data.contactPhone" class="g-input" /></div>
        <div><label class="g-label block mb-1">地址</label><textarea v-model="editor.data.address" class="g-input" rows="2"></textarea></div>
      </div>
      <template #footer>
        <button class="g-btn g-btn-glass" @click="editor.show = false">取消</button>
        <button class="g-btn g-btn-brand" @click="save">儲存</button>
      </template>
    </GlassModal>

    <ConfirmDialog :show="confirmDel.show" title="刪除聯絡人？" :message="confirmDel.c?.companyName || ''"
      confirm-text="刪除" danger
      @confirm="remove" @cancel="confirmDel = { show: false, c: null }" />
  </section>
</template>
