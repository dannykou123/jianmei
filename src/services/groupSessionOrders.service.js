// GroupSessionOrders 服務（訂購人下單暫存區，送審通過後複製到 Orders）
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';

const COL = 'GroupSessionOrders';

/**
 * GroupSessionOrders/{id}：
 * {
 *   sessionId,
 *   customerName, customerUnit,
 *   items: [{ itemName, qty, price, subtotal }],
 *   totalAmount,
 *   note,
 *   paid: boolean,
 *   source: 'customer' | 'organizer',
 *   anonUid?,         // 訂購人匿名 auth uid
 *   createdAt, updatedAt
 * }
 */
export async function listOrdersBySession(sessionId) {
  const q = query(collection(db, COL), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSessionOrder(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createSessionOrder(data) {
  const payload = {
    paid: false,
    note: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...data,
  };
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

export async function updateSessionOrder(id, data) {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteSessionOrder(id) {
  await deleteDoc(doc(db, COL, id));
}

export function subscribeOrdersBySession(sessionId, callback) {
  const q = query(collection(db, COL), where('sessionId', '==', sessionId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
