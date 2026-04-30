// FrequentContacts 服務（常用聯絡人）
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';

const COL = 'FrequentContacts';

export async function listContacts() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createContact(data) {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateContact(id, data) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteContact(id) {
  await deleteDoc(doc(db, COL, id));
}
