// GroupOrders + Orders collection 服務（既有後台訂單）
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, writeBatch, Timestamp, limit,
} from 'firebase/firestore';
import { db } from '@/firebase';

const GROUP = 'GroupOrders';
const ORDERS = 'Orders';
const GSO = 'GroupSessionOrders';
const SESSIONS = 'GroupSessions';

// 允許從 Orders 同步回 GroupSessionOrders 的欄位
const ORDER_SYNC_FIELDS = new Set(['paid', 'items', 'totalAmount', 'note', 'customerName', 'customerUnit']);

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
  // 同步回 GroupSessions（best-effort）
  try {
    const snap = await getDoc(doc(db, GROUP, id));
    if (!snap.exists()) return;
    const linkedSessionId = snap.data().linkedSessionId;
    if (!linkedSessionId) return;

    const sessionUpdate = { updatedAt: Timestamp.now() };

    // 同步狀態欄位
    const STATUS_FIELDS = ['status', 'approvedAt', 'rejectedAt', 'rejectedReason'];
    for (const k of STATUS_FIELDS) {
      if (k in data) sessionUpdate[k] = data[k];
    }

    // 重算總金額（只要有異動 status 或 totalAmount 就重算）
    if ('status' in data || 'totalAmount' in data) {
      const ordersSnap = await getDocs(
        query(collection(db, ORDERS), where('groupOrderId', '==', id))
      );
      sessionUpdate.totalAmount = ordersSnap.docs.reduce(
        (s, d) => s + (Number(d.data().totalAmount) || 0), 0
      );
    }

    await updateDoc(doc(db, SESSIONS, linkedSessionId), sessionUpdate);
  } catch (e) {
    console.warn('[updateGroupOrder] sync to GroupSessions failed:', e);
  }
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
  // best-effort：同步回 GroupSessionOrders 並重算 GroupOrders / GroupSessions 總金額
  try {
    const snap = await getDoc(doc(db, ORDERS, id));
    if (!snap.exists()) return;
    const orderData = snap.data();

    // 1. 同步指定欄位回 GroupSessionOrders
    const linkedId = orderData.linkedSessionOrderId;
    if (linkedId) {
      const syncData = {};
      for (const [k, v] of Object.entries(data)) {
        if (ORDER_SYNC_FIELDS.has(k)) syncData[k] = v;
      }
      if (Object.keys(syncData).length > 0) {
        await updateDoc(doc(db, GSO, linkedId), { ...syncData, updatedAt: Timestamp.now() });
      }
    }

    // 2. 重算同一 GroupOrder 下所有 Orders 總金額
    const groupOrderId = orderData.groupOrderId;
    if (groupOrderId && 'totalAmount' in data) {
      const ordersSnap = await getDocs(
        query(collection(db, ORDERS), where('groupOrderId', '==', groupOrderId))
      );
      const newTotal = ordersSnap.docs.reduce((s, d) => s + (Number(d.data().totalAmount) || 0), 0);

      // 更新 GroupOrders.totalAmount
      await updateDoc(doc(db, GROUP, groupOrderId), { totalAmount: newTotal, updatedAt: new Date().toISOString() });

      // 3. 取 linkedSessionId，更新 GroupSessions.totalAmount
      const groupSnap = await getDoc(doc(db, GROUP, groupOrderId));
      const linkedSessionId = groupSnap.exists() ? groupSnap.data().linkedSessionId : null;
      if (linkedSessionId) {
        await updateDoc(doc(db, SESSIONS, linkedSessionId), {
          totalAmount: newTotal,
          updatedAt: Timestamp.now(),
        });
      }
    }
  } catch (e) {
    console.warn('[updateOrder] sync failed:', e);
  }
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
