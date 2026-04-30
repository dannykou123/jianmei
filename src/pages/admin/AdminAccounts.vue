<script setup>
import { ref, onMounted } from 'vue';
import { listAccounts, updateAccount, deleteAccount } from '@/services/accounts.service';
import GlassModal from '@/components/GlassModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const list = ref([]);
const loading = ref(true);
const editor = ref({ show: false, data: null });
const confirmDel = ref({ show: false, acc: null });

async function load() {
  loading.value = true;
  list.value = await listAccounts();
  loading.value = false;
}
onMounted(load);

function openEdit(acc) {
  editor.value = { show: true, data: { ...acc } };
}

async function save() {
  const d = editor.value.data;
  await updateAccount(d.id, {
    name: d.name || '',
    phone: d.phone || '',
    role: d.role || 'user',
    isAuthorized: !!d.isAuthorized,
  });
  editor.value.show = false;
  await load();
}

async function remove() {
  await deleteAccount(confirmDel.value.acc.id);
  confirmDel.value = { show: false, acc: null };
  await load();
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">帳號管理 ({{ list.length }})</h2>
      <button class="g-btn g-btn-glass g-btn-sm" @click="load"><i class="fas fa-rotate"></i></button>
    </div>
    <div v-if="loading" class="text-center py-12 text-stone-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
    <div v-else class="space-y-2">
      <div v-for="a in list" :key="a.id" class="g-card-solid p-3 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold truncate">{{ a.name || a.email }}</span>
            <span v-if="a.role === 'admin'" class="g-badge g-badge-info">管理員</span>
            <span v-if="a.isAuthorized" class="g-badge g-badge-approved">已授權</span>
            <span v-else class="g-badge g-badge-pending">待授權</span>
          </div>
          <p class="text-xs text-stone-500 truncate">{{ a.email }} · {{ a.phone || '無電話' }}</p>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm" @click="openEdit(a)"><i class="fas fa-pen"></i></button>
        <button class="g-btn g-btn-danger g-btn-sm" @click="confirmDel = { show: true, acc: a }"><i class="fas fa-trash"></i></button>
      </div>
    </div>

    <GlassModal :show="editor.show" title="編輯帳號" @close="editor.show = false">
      <div v-if="editor.data" class="space-y-3">
        <div><label class="g-label block mb-1">電子郵件</label><input :value="editor.data.email" class="g-input" disabled /></div>
        <div><label class="g-label block mb-1">姓名</label><input v-model="editor.data.name" class="g-input" /></div>
        <div><label class="g-label block mb-1">電話</label><input v-model="editor.data.phone" class="g-input" /></div>
        <div><label class="g-label block mb-1">角色</label>
          <select v-model="editor.data.role" class="g-select">
            <option value="user">一般使用者</option>
            <option value="admin">管理員</option>
          </select>
        </div>
        <div><label class="inline-flex items-center gap-2"><input type="checkbox" v-model="editor.data.isAuthorized" /> 已授權</label></div>
      </div>
      <template #footer>
        <button class="g-btn g-btn-glass" @click="editor.show = false">取消</button>
        <button class="g-btn g-btn-brand" @click="save">儲存</button>
      </template>
    </GlassModal>

    <ConfirmDialog :show="confirmDel.show" title="刪除帳號？" :message="confirmDel.acc?.email || ''"
      confirm-text="刪除" danger
      @confirm="remove" @cancel="confirmDel = { show: false, acc: null }" />
  </section>
</template>
