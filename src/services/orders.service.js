// GroupOrders + Orders collection 服務（既有後台訂單）
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, writeBatch, Timestamp, limit,
} from 'firebase/firestore';
import { db } from '@/firebase';

const GROUP = 'GroupOrders';
const ORDERS = 'Orders';

// ── GroupOrders ─────────────────────────────────────────────
export async function listGroupOrders({ status } = {}) {
  let q = collection(db, GROUP);
  if (status) q = query(q, where('status', '==', status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getGroupOrder(id) {
  const ref = doc(db, GROUP, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createGroupOrder(data) {
  const ref = await addDoc(collection(db, GROUP), data);
  return ref.id;
}

export async function setGroupOrder(id, data) {
  await setDoc(doc(db, GROUP, id), data);
}

export async function updateGroupOrder(id, data) {
  await updateDoc(doc(db, GROUP, id), data);
}

export async function deleteGroupOrder(id) {
  await deleteDoc(doc(db, GROUP, id));
}

export function subscribeGroupOrders(callback, { status } = {}) {
  let q = collection(db, GROUP);
  if (status) q = query(q, where('status', '==', status));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ── Orders ─────────────────────────────────────────────────
export async function listOrdersByGroup(groupOrderId) {
  const q = query(collection(db, ORDERS), where('groupOrderId', '==', groupOrderId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createOrder(data) {
  const ref = await addDoc(collection(db, ORDERS), data);
  return ref.id;
}

export async function updateOrder(id, data) {
  await updateDoc(doc(db, ORDERS, id), data);
}

export async function deleteOrder(id) {
  await deleteDoc(doc(db, ORDERS, id));
}

export function subscribeOrdersByGroup(groupOrderId, callback) {
  const q = query(collection(db, ORDERS), where('groupOrderId', '==', groupOrderId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ── 批次操作（送出審核 / 收回） ─────────────────────────────
/**
 * 將團購人 session 的下單資料一次寫入後台（建立 GroupOrders + 多筆 Orders）
 * 會在同一個 batch 中完成，確保原子性。
 * @returns {Promise<string>} 新建立的 GroupOrder id
 */
export async function batchCreateGroupWithOrders(groupData, ordersList) {
  const batch = writeBatch(db);
  const groupRef = doc(collection(db, GROUP));
  batch.set(groupRef, { ...groupData, createdAt: Timestamp.now() });
  for (const o of ordersList) {
    const orderRef = doc(collection(db, ORDERS));
    batch.set(orderRef, { ...o, groupOrderId: groupRef.id, createdAt: Timestamp.now() });
  }
  await batch.commit();
  return groupRef.id;
}

/**
 * 收回送審：刪除 GroupOrder 與所有對應 Orders
 */
export async function batchDeleteGroupWithOrders(groupOrderId) {
  const ordersSnap = await getDocs(query(collection(db, ORDERS), where('groupOrderId', '==', groupOrderId)));
  const batch = writeBatch(db);
  batch.delete(doc(db, GROUP, groupOrderId));
  ordersSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
