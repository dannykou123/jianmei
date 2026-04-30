// Accounts collection 服務（admin 後台帳號）
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';
import { db } from '@/firebase';

const COL = 'Accounts';

export async function getAccountByEmail(email) {
  const q = query(collection(db, COL), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getAccountById(id) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createAccount(id, data) {
  await setDoc(doc(db, COL, id), data);
}

export async function updateAccount(id, data) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteAccount(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function listAccounts() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
