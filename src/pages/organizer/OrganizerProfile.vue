<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import { updateOrganizer } from '@/services/organizers.service';
import {
  generateBindingToken,
  getOrganizerLineStatus,
  unbindLine,
  getNotificationPreferences,
  saveNotificationPreference,
  DELIVERY_STATUSES,
} from '@/services/line.service';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import CustomAlert from '@/components/CustomAlert.vue';

const router = useRouter();
const auth = useOrganizerAuth();
const form = ref({ name: '', phone: '', company: '', address: '' });
const saving = ref(false);
const alertState = ref({ show: false, title: '', message: '', type: 'info' });

// ── LINE 綁定 ─────────────────────────────────────────────────────────
const lineStatus = ref(null);    // { isLineBound, lineDisplayName, linePictureUrl, lineBoundAt }
const liffUrl = ref('');
const qrDataUrl = ref('');
const generatingToken = ref(false);
const unbinding = ref(false);
const loadingLine = ref(true);

// ── 通知偏好 ──────────────────────────────────────────────────────────
const notifPrefs = ref({});      // { preparing: true, shipped: true, ... }
const savingPref = ref('');
const loadingPrefs = ref(true);

// ── 個人資料 ──────────────────────────────────────────────────────────
watch(() => auth.profile, (p) => {
  if (p) form.value = { name: p.name || '', phone: p.phone || '', company: p.company || '', address: p.address || '' };
}, { immediate: true });

onMounted(async () => {
  if (!auth.firebaseUser) return;
  const uid = auth.firebaseUser.uid;

  // 通知偏好一次性讀取
  const prefs = await getNotificationPreferences(uid);
  notifPrefs.value = prefs;
  loadingPrefs.value = false;

  // Firestore 即時監聽 Organizers/{uid}，手機綁定後電腦端自動更新
  const unsub = onSnapshot(doc(db, 'Organizers', uid), (snap) => {
    if (!snap.exists()) {
      lineStatus.value = { isLineBound: false };
      loadingLine.value = false;
      return;
    }
    const d = snap.data();
    lineStatus.value = {
      isLineBound:      d.isLineBound      || false,
      lineDisplayName:  d.lineDisplayName  || '',
      linePictureUrl:   d.linePictureUrl   || '',
      lineBoundAt:      d.lineBoundAt      || null,
    };
    loadingLine.value = false;
  });

  onUnmounted(unsub);

  // 當使用者從 LIFF 綁定頁切回此頁時也刷新（補強）
  const onVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && auth.firebaseUser) {
      const fresh = await getOrganizerLineStatus(auth.firebaseUser.uid);
      lineStatus.value = fresh;
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange));
});

async function save() {
  if (!form.value.name || !form.value.phone) {
    alert('至少需要姓名與電話');
    return;
  }
  saving.value = true;
  try {
    await updateOrganizer(auth.firebaseUser.uid, { ...form.value });
    await auth.refresh();
    showAlert('已儲存', '個人資料已更新', 'success');
  } catch (e) {
    showAlert('儲存失敗', e.message, 'error');
  } finally {
    saving.value = false;
  }
}

// ── LINE 綁定相關 ─────────────────────────────────────────────────────

async function requestBindingToken() {
  generatingToken.value = true;
  liffUrl.value = '';
  qrDataUrl.value = '';
  try {
    const result = await generateBindingToken();
    liffUrl.value = result.liffUrl;
    await generateQR(result.liffUrl);
  } catch (e) {
    showAlert('無法生成綁定連結', e.message, 'error');
  } finally {
    generatingToken.value = false;
  }
}

async function generateQR(url) {
  // 使用 Canvas 動態繪製簡易 QR Code 佔位，實際 QR 由 LIFF URL 圖示表示
  // 若專案已安裝 qrcode 套件可替換為：
  //   import QRCode from 'qrcode';
  //   qrDataUrl.value = await QRCode.toDataURL(url);
  qrDataUrl.value = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=200x200&margin=10`;
}

async function copyLiffUrl() {
  try {
    await navigator.clipboard.writeText(liffUrl.value);
    showAlert('已複製', '綁定連結已複製至剪貼簿', 'success');
  } catch {
    showAlert('複製失敗', liffUrl.value, 'warn');
  }
}

async function doUnbind() {
  if (!confirm('確定要解除 LINE 帳號綁定嗎？')) return;
  unbinding.value = true;
  try {
    await unbindLine(auth.firebaseUser.uid);
    await auth.refresh();
    lineStatus.value = { isLineBound: false };
    liffUrl.value = '';
    qrDataUrl.value = '';
    showAlert('已解除綁定', '您的 LINE 帳號已與系統解除連結', 'success');
  } catch (e) {
    showAlert('解除失敗', e.message, 'error');
  } finally {
    unbinding.value = false;
  }
}

// ── 通知偏好 ──────────────────────────────────────────────────────────

async function togglePref(status, value) {
  savingPref.value = status;
  notifPrefs.value[status] = value;
  try {
    await saveNotificationPreference(auth.firebaseUser.uid, status, value);
  } catch (e) {
    notifPrefs.value[status] = !value; // rollback
    showAlert('設定失敗', e.message, 'error');
  } finally {
    savingPref.value = '';
  }
}

// ── 工具 ─────────────────────────────────────────────────────────────
function showAlert(title, message, type = 'info') {
  alertState.value = { show: true, title, message, type };
}

function fmtBoundAt(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString('zh-TW');
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

    <!-- ── 基本資料 ───────────────────────────────────────────────── -->
    <div class="g-card-solid p-4 space-y-3">
      <div><label class="g-label block mb-1">姓名 *</label><input v-model="form.name" class="g-input" /></div>
      <div><label class="g-label block mb-1">電話 *</label><input v-model="form.phone" class="g-input" /></div>
      <div><label class="g-label block mb-1">公司／單位</label><input v-model="form.company" class="g-input" /></div>
      <div><label class="g-label block mb-1">地址</label><textarea v-model="form.address" class="g-input" rows="2"></textarea></div>
      <button class="g-btn g-btn-brand g-btn-lg w-full" :disabled="saving" @click="save">
        <i class="fas fa-floppy-disk"></i> {{ saving ? '儲存中...' : '儲存資料' }}
      </button>
    </div>

    <!-- ── LINE 帳號綁定 ──────────────────────────────────────────── -->
    <div class="g-card-solid p-4 space-y-3">
      <h3 class="font-bold flex items-center gap-2">
        <i class="fab fa-line text-xl" style="color: #06C755"></i>
        LINE 帳號綁定
      </h3>

      <div v-if="loadingLine" class="text-center py-4 text-stone-400">
        <i class="fas fa-spinner fa-spin"></i>
      </div>

      <!-- 已綁定 -->
      <template v-else-if="lineStatus?.isLineBound">
        <div class="flex items-center gap-3 p-3 rounded-xl" style="background: var(--surface-2)">
          <img v-if="lineStatus.linePictureUrl" :src="lineStatus.linePictureUrl"
               class="w-10 h-10 rounded-full flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ lineStatus.lineDisplayName }}</p>
            <p class="text-xs" style="color: var(--text-secondary)">
              <i class="fas fa-link mr-1"></i>綁定於 {{ fmtBoundAt(lineStatus.lineBoundAt) }}
            </p>
          </div>
          <span class="text-xs font-bold px-2 py-1 rounded-full"
                style="background: #d1fae5; color: #065f46;">已綁定</span>
        </div>
        <button class="g-btn g-btn-glass g-btn-sm w-full" :disabled="unbinding" @click="doUnbind">
          <i class="fas fa-unlink"></i> {{ unbinding ? '解除中...' : '解除 LINE 綁定' }}
        </button>
      </template>

      <!-- 未綁定 -->
      <template v-else>
        <p class="text-sm" style="color: var(--text-secondary)">
          綁定後，訂單備貨、出貨、配送狀態將透過 LINE 即時通知您。
        </p>

        <button
          class="g-btn g-btn-brand g-btn-lg w-full"
          :disabled="generatingToken"
          @click="requestBindingToken"
        >
          <i class="fab fa-line"></i>
          {{ generatingToken ? '生成中...' : '生成 LINE 綁定連結' }}
        </button>

        <!-- 綁定連結展示 -->
        <div v-if="liffUrl" class="space-y-3 animate-slide-up">
          <p class="text-sm font-medium text-center" style="color: var(--text-secondary)">
            在 LINE App 中開啟下方連結或掃描 QR Code
            <br /><span class="text-xs">（連結 15 分鐘內有效）</span>
          </p>

          <!-- QR Code -->
          <div class="flex justify-center">
            <img :src="qrDataUrl" alt="LINE 綁定 QR Code" class="w-48 h-48 rounded-xl border-2"
                 style="border-color: var(--surface-3)" />
          </div>

          <!-- 連結 + 複製 -->
          <div class="flex gap-2">
            <div class="flex-1 g-card p-2 rounded-xl text-xs font-mono break-all"
                 style="color: var(--text-secondary)">
              {{ liffUrl }}
            </div>
            <button class="g-btn g-btn-glass flex-shrink-0" @click="copyLiffUrl">
              <i class="fas fa-copy"></i>
            </button>
          </div>

          <!-- 在 LINE App 內直接開啟 -->
          <a :href="liffUrl" target="_blank"
             class="g-btn g-btn-glass g-btn-lg w-full block text-center">
            <i class="fas fa-external-link-alt"></i> 開啟 LINE 連結
          </a>
        </div>
      </template>
    </div>

    <!-- ── 通知偏好設定 ────────────────────────────────────────────── -->
    <div v-if="lineStatus?.isLineBound" class="g-card-solid p-4 space-y-3">
      <h3 class="font-bold">LINE 通知偏好</h3>
      <p class="text-sm" style="color: var(--text-secondary)">
        選擇您希望接收哪些配送狀態的 LINE 通知。
      </p>

      <div v-if="loadingPrefs" class="text-center py-4 text-stone-400">
        <i class="fas fa-spinner fa-spin"></i>
      </div>

      <div v-else class="space-y-2">
        <label
          v-for="s in DELIVERY_STATUSES"
          :key="s.value"
          class="flex items-center justify-between p-3 rounded-xl cursor-pointer"
          style="background: var(--surface-2)"
        >
          <div class="flex items-center gap-2">
            <i :class="['fas', s.icon]" :style="{ color: s.color }"></i>
            <span class="text-sm font-medium">{{ s.label }}</span>
            <i v-if="savingPref === s.value" class="fas fa-spinner fa-spin text-xs text-stone-400"></i>
          </div>
          <input
            type="checkbox"
            :checked="notifPrefs[s.value] !== false"
            class="w-4 h-4 accent-brand"
            @change="togglePref(s.value, $event.target.checked)"
          />
        </label>
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
