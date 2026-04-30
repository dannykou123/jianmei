// Items collection 服務（商品資料）
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase';

const COL = 'Items';

export async function listItems({ type } = {}) {
  let q = collection(db, COL);
  if (type) q = query(q, where('type', '==', type));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getItem(id) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createItem(data) {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateItem(id, data) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteItem(id) {
  await deleteDoc(doc(db, COL, id));
}
