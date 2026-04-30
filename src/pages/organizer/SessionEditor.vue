<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Timestamp } from 'firebase/firestore';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import {
  getActiveSessionByOrganizer, createSession, updateSession, getSession, SESSION_STATUS,
} from '@/services/groupSessions.service';
import { toDateInputValue } from '@/composables/useFmt';
import CustomAlert from '@/components/CustomAlert.vue';

const props = defineProps({ id: { type: String, default: '' } });
const router = useRouter();
const auth = useOrganizerAuth();

const isEdit = computed(() => !!props.id);
const loading = ref(true);
const saving = ref(false);
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

const form = ref({
  companyName: '',
  contactName: '',
  contactPhone: '',
  address: '',
  deliveryTime: '',          // datetime-local string
  units: [],                  // string[]
  orderType: 'regular',
});
const newUnit = ref('');

onMounted(async () => {
  if (isEdit.value) {
    const s = await getSession(props.id);
    if (s) {
      form.value = {
        companyName: s.companyName || '',
        contactName: s.contactName || '',
        contactPhone: s.contactPhone || '',
        address: s.address || '',
        deliveryTime: toDateInputValue(s.deliveryTime),
        units: [...(s.units || [])],
        orderType: s.orderType || 'regular',
      };
    }
  } else {
    // 檢查是否已有 active session
    const active = await getActiveSessionByOrganizer(auth.firebaseUser.uid);
    if (active) {
      alertState.value = {
        show: true, title: '已有進行中的開團', type: 'warn',
        message: '請先關閉現有開團才能建立新的。',
      };
      setTimeout(() => router.replace('/organizer'), 1200);
      loading.value = false;
      return;
    }
    // 自動帶入 profile
    const p = auth.profile || {};
    form.value.companyName = p.company || '';
    form.value.contactName = p.name || '';
    form.value.contactPhone = p.phone || '';
    form.value.address = p.address || '';
  }
  loading.value = false;
});

function addUnit() {
  const u = newUnit.value.trim();
  if (!u) return;
  if (form.value.units.includes(u)) return;
  form.value.units.push(u);
  newUnit.value = '';
}
function removeUnit(i) { form.value.units.splice(i, 1); }

function validate() {
  const f = form.value;
  if (!f.companyName) return '請填寫公司／單位';
  if (!f.contactName) return '請填寫聯絡人';
  if (!f.contactPhone) return '請填寫聯絡電話';
  if (!f.address) return '請填寫地址';
  if (!f.deliveryTime) return '請設定交貨時間';
  const dt = new Date(f.deliveryTime);
  if (isNaN(dt.getTime())) return '交貨時間格式錯誤';
  if (dt.getTime() <= Date.now()) return '交貨時間不可早於現在';
  if (!f.units.length) return '請至少設定一個單位';
  return null;
}

async function submit() {
  const err = validate();
  if (err) {
    alertState.value = { show: true, title: '請檢查資料', message: err, type: 'warn' };
    return;
  }
  saving.value = true;
  try {
    const payload = {
      organizerUid: auth.firebaseUser.uid,
      companyName: form.value.companyName,
      contactName: form.value.contactName,
      contactPhone: form.value.contactPhone,
      address: form.value.address,
      deliveryTime: Timestamp.fromDate(new Date(form.value.deliveryTime)),
      units: [...form.value.units],
      orderType: form.value.orderType,
    };
    if (isEdit.value) {
      await updateSession(props.id, payload);
      router.replace(`/organizer/session/${props.id}`);
    } else {
      payload.status = SESSION_STATUS.OPEN;
      const id = await createSession(payload);
      router.replace(`/organizer/session/${id}`);
    }
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
      <h2 class="text-xl font-bold">{{ isEdit ? '編輯開團' : '建立新開團' }}</h2>
      <button class="g-btn g-btn-glass g-btn-sm" @click="router.back()">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-stone-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div>

    <div v-else class="g-card-solid p-4 space-y-3">
      <div><label class="g-label block mb-1">公司／單位 *</label><input v-model="form.companyName" class="g-input" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="g-label block mb-1">聯絡人 *</label><input v-model="form.contactName" class="g-input" /></div>
        <div><label class="g-label block mb-1">電話 *</label><input v-model="form.contactPhone" class="g-input" /></div>
      </div>
      <div><label class="g-label block mb-1">地址 *</label><textarea v-model="form.address" class="g-input" rows="2"></textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="g-label block mb-1">交貨時間 *</label>
          <input v-model="form.deliveryTime" type="datetime-local" class="g-input" />
        </div>
        <div>
          <label class="g-label block mb-1">訂單類型</label>
          <select v-model="form.orderType" class="g-select">
            <option value="regular">一般</option>
            <option value="vacuum">真空</option>
          </select>
        </div>
      </div>
      <div>
        <label class="g-label block mb-1">本次開團單位 *</label>
        <div class="flex gap-2 mb-2">
          <input v-model="newUnit" class="g-input flex-1" placeholder="例：總務處、財務部"
                 @keydown.enter.prevent="addUnit" />
          <button class="g-btn g-btn-glass" @click="addUnit"><i class="fas fa-plus"></i></button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="(u, i) in form.units" :key="u"
                class="g-badge g-badge-info cursor-pointer" @click="removeUnit(i)" title="點擊移除">
            {{ u }} <i class="fas fa-xmark ml-1"></i>
          </span>
          <span v-if="!form.units.length" class="text-xs text-stone-400">尚未設定</span>
        </div>
      </div>
      <button class="g-btn g-btn-brand g-btn-lg w-full" :disabled="saving" @click="submit">
        <i class="fas fa-rocket"></i> {{ isEdit ? '儲存變更' : '開始開團' }}
      </button>
    </div>

    <CustomAlert :show="alertState.show" :title="alertState.title" :message="alertState.message" :type="alertState.type"
                 @close="alertState.show = false" />
  </section>
</template>
