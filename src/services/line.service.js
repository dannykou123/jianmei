// LINE 綁定、通知偏好、配送狀態相關 Firestore 操作 + Cloud Function 呼叫
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  deleteField,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/firebase';

const functions = getFunctions();

export const DELIVERY_STATUSES = [
  { value: 'preparing',  label: '備貨中',   icon: 'fa-box',                  color: '#B0736A' },
  { value: 'shipped',    label: '已出貨',   icon: 'fa-truck',                color: '#2563eb' },
  { value: 'delivering', label: '配送中',   icon: 'fa-person-running',       color: '#7c3aed' },
  { value: 'delivered',  label: '已送達',   icon: 'fa-circle-check',         color: '#16a34a' },
  { value: 'exception',  label: '配送異常', icon: 'fa-triangle-exclamation', color: '#dc2626' },
];

// 團購主 LINE 通知偏好使用的狀態清單
export const ORGANIZER_NOTIFICATION_STATUSES = [
  { value: 'pending',   label: '待審核', icon: 'fa-clock',        color: '#f97316' },
  { value: 'approved',  label: '已接單', icon: 'fa-check',        color: '#16a34a' },
  { value: 'rejected',  label: '已拒單', icon: 'fa-xmark',        color: '#dc2626' },
  { value: 'shipped',   label: '已出貨', icon: 'fa-truck',        color: '#2563eb' },
  { value: 'delivered', label: '已送達', icon: 'fa-circle-check', color: '#059669' },
];

export const DEFAULT_TEMPLATES = {
  preparing:  '【健美滷味】{{用戶姓名}}，您的訂單正在備貨中 📦\n\n如有問題歡迎聯繫我們！',
  shipped:    '【健美滷味】{{用戶姓名}}，您的訂單已出貨！🚚\n預計送達：{{預計送貨日}}\n\n感謝您的支持！',
  delivering: '【健美滷味】{{用戶姓名}}，您的訂單正在配送中 🏃\n預計今日送達：{{預計送貨日}}',
  delivered:  '【健美滷味】{{用戶姓名}}，您的訂單已送達！✅\n\n感謝您的光顧，期待下次開團！',
  exception:  '【健美滷味】{{用戶姓名}}，您的訂單發生異常 ⚠️\n說明：{{備註}}\n\n我們將盡快與您聯繫，造成不便敬請見諒。',
};

// ── 綁定 Token ────────────────────────────────────────────────────────

export async function generateBindingToken() {
  const fn = httpsCallable(functions, 'generateBindingToken');
  const result = await fn();
  return result.data; // { token, liffUrl }
}

// ── LINE 綁定狀態 ─────────────────────────────────────────────────────

export async function getOrganizerLineStatus(uid) {
  const snap = await getDoc(doc(db, 'Organizers', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    isLineBound:      d.isLineBound || false,
    lineUserId:       d.lineUserId || '',
    lineDisplayName:  d.lineDisplayName || '',
    linePictureUrl:   d.linePictureUrl || '',
    lineBoundAt:      d.lineBoundAt || null,
  };
}

export async function unbindLine(uid) {
  await updateDoc(doc(db, 'Organizers', uid), {
    isLineBound:     false,
    lineUserId:      deleteField(),
    lineDisplayName: deleteField(),
    linePictureUrl:  deleteField(),
    lineBoundAt:     deleteField(),
    updatedAt:       new Date().toISOString(),
  });
}

// ── 通知偏好設定 ──────────────────────────────────────────────────────

export async function getNotificationPreferences(uid, statuses = DELIVERY_STATUSES) {
  const prefs = {};
  await Promise.all(
    statuses.map(async ({ value }) => {
      const snap = await getDoc(doc(db, 'userNotificationPreferences', `${uid}_${value}`));
      prefs[value] = snap.exists() ? snap.data().isEnabled : true;
    })
  );
  return prefs; // { pending: true, approved: true, ... }
}

export async function saveNotificationPreference(uid, status, isEnabled) {
  await setDoc(doc(db, 'userNotificationPreferences', `${uid}_${status}`), {
    userId:    uid,
    status,
    isEnabled,
    updatedAt: new Date().toISOString(),
  });
}

// ── 配送狀態管理（Admin） ─────────────────────────────────────────────

export async function updateDeliveryStatus(payload) {
  const fn = httpsCallable(functions, 'updateDeliveryStatus');
  const result = await fn(payload);
  return result.data;
}

export async function getDeliveryStatusHistory(groupOrderId) {
  const col = collection(db, 'GroupOrders', groupOrderId, 'deliveryStatusHistory');
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ── 通知範本管理（Admin） ─────────────────────────────────────────────

export async function getNotificationTemplates() {
  const snap = await getDocs(collection(db, 'notificationTemplates'));
  const map = {};
  snap.docs.forEach((d) => { map[d.data().status] = d.data().body; });
  return map; // { preparing: '...', shipped: '...', ... }
}

export async function saveNotificationTemplate(status, body) {
  const fn = httpsCallable(functions, 'saveNotificationTemplate');
  const result = await fn({ status, body });
  return result.data;
}

export async function notifySessionStatusChange(groupOrderId, status, rejectedReason = '') {
  const fn = httpsCallable(functions, 'notifySessionStatusChange');
  const result = await fn({ groupOrderId, status, rejectedReason });
  return result.data;
}
