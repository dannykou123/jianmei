// Organizers collection 服務（團購人帳號 profile）
import {
  doc, getDoc, setDoc, updateDoc, getDocs, collection,
} from 'firebase/firestore';
import { db } from '@/firebase';

const COL = 'Organizers';

/**
 * Organizers/{uid} 文件結構：
 * {
 *   uid, email, displayName, photoURL,
 *   name, phone, company, address,
 *   activeSessionId,  // 目前 active session（非 closed）
 *   createdAt, updatedAt
 * }
 */
export async function getOrganizer(uid) {
  const snap = await getDoc(doc(db, COL, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function ensureOrganizer(uid, googleData) {
  const existing = await getOrganizer(uid);
  if (existing) return existing;
  const data = {
    uid,
    email: googleData.email || '',
    displayName: googleData.displayName || '',
    photoURL: googleData.photoURL || '',
    name: '',
    phone: '',
    company: '',
    address: '',
    activeSessionId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COL, uid), data);
  return data;
}

export async function updateOrganizer(uid, data) {
  await updateDoc(doc(db, COL, uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function listOrganizers() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
