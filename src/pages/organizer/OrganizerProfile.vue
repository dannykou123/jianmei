<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import { updateOrganizer } from '@/services/organizers.service';
import CustomAlert from '@/components/CustomAlert.vue';

const router = useRouter();
const auth = useOrganizerAuth();
const form = ref({ name: '', phone: '', company: '', address: '' });
const saving = ref(false);
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

watch(() => auth.profile, (p) => {
  if (p) form.value = { name: p.name || '', phone: p.phone || '', company: p.company || '', address: p.address || '' };
}, { immediate: true });

async function save() {
  if (!form.value.name || !form.value.phone) {
    alertState.value = { show: true, title: '請填寫必要欄位', message: '至少需要姓名與電話', type: 'warn' };
    return;
  }
  saving.value = true;
  try {
    await updateOrganizer(auth.firebaseUser.uid, { ...form.value });
    await auth.refresh();
    alertState.value = { show: true, title: '已儲存', message: '個人資料已更新', type: 'success' };
  } catch (e) {
    alertState.value = { show: true, title: '儲存失敗', message: e.message, type: 'error' };
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">個人資料</h2>
      <button class="g-btn g-btn-glass g-btn-sm" @click="router.push('/organizer')">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
    </div>
    <div class="g-card-solid p-4 space-y-3">
      <div><label class="g-label block mb-1">姓名 *</label><input v-model="form.name" class="g-input" /></div>
      <div><label class="g-label block mb-1">電話 *</label><input v-model="form.phone" class="g-input" /></div>
      <div><label class="g-label block mb-1">公司／單位</label><input v-model="form.company" class="g-input" /></div>
      <div><label class="g-label block mb-1">地址</label><textarea v-model="form.address" class="g-input" rows="2"></textarea></div>
      <button class="g-btn g-btn-brand g-btn-lg w-full" :disabled="saving" @click="save">
        <i class="fas fa-floppy-disk"></i> {{ saving ? '儲存中...' : '儲存' }}
      </button>
    </div>
    <CustomAlert :show="alertState.show" :title="alertState.title" :message="alertState.message" :type="alertState.type"
                 @close="alertState.show = false" />
  </section>
</template>
