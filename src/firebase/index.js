// Firebase 初始化（沿用 legacy/index.html 的 firebaseConfig，鎖定 SDK 10.7.1）
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDb3xTmnkscf9tC5znTBzkCfSzD0zLJTYk',
  authDomain: 'jianmei-food-54760.firebaseapp.com',
  projectId: 'jianmei-food-54760',
  storageBucket: 'jianmei-food-54760.firebasestorage.app',
  messagingSenderId: '367136535654',
  appId: '1:367136535654:web:119d8cb066dfb378e1a9a7',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
