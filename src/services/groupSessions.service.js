// GroupSessions 服務（團購人開團即時狀態）
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';

const COL = 'GroupSessions';

/**
 * GroupSessions/{sessionId} 文件結構：
 * {
 *   organizerUid,
 *   status,          // 'open' | 'pending' | 'approved' | 'rejected' | 'closed'
 *   companyName, contactName, contactPhone, address,
 *   deliveryTime,    // Timestamp
 *   units: string[], // 團購人設定的可選單位
 *   orderType,       // 'regular' | 'vacuum'
 *   linkedGroupOrderId,    // 送審後關聯的 GroupOrders id
 *   totalAmount,
 *   createdAt, updatedAt, submittedAt?, approvedAt?, rejectedAt?
 *   rejectedReason?
 * }
 *
 * 狀態機：
 *   open ↔ closed
 *   open → pending（送審）
 *   pending → open（收回）
 *   pending → approved | rejected（後台審核）
 *   rejected → open（重新編輯）/ closed（放棄）
 *   approved → closed（完成）
 */
export const SESSION_STATUS = Object.freeze({
  OPEN: 'open',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
});

export const ACTIVE_STATUSES = ['open', 'pending', 'approved', 'rejected'];

export async function getSession(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createSession(data) {
  const payload = {
    status: SESSION_STATUS.OPEN,
    totalAmount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...data,
  };
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

export async function updateSession(id, data) {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteSession(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function getActiveSessionByOrganizer(organizerUid) {
  const q = query(
    collection(db, COL),
    where('organizerUid', '==', organizerUid),
    where('status', 'in', ACTIVE_STATUSES),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function listSessionsByOrganizer(organizerUid) {
  const q = query(collection(db, COL), where('organizerUid', '==', organizerUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeSession(id, callback) {
  return onSnapshot(doc(db, COL, id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function subscribeOrganizerSessions(organizerUid, callback) {
  const q = query(collection(db, COL), where('organizerUid', '==', organizerUid));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
