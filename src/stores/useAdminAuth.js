// useAdminAuth：admin 登入流程（Google → Accounts 檢查 → 授權判定）
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  signInWithPopup, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { getAccountByEmail, createAccount } from '@/services/accounts.service';

export const useAdminAuth = defineStore('adminAuth', () => {
  const account = ref(null);          // Accounts 文件
  const firebaseUser = ref(null);     // firebase auth user
  const loading = ref(true);
  const error = ref('');

  const isLoggedIn = computed(() => !!account.value);
  const isAuthorized = computed(() => account.value?.isAuthorized === true);
  const isAdmin = computed(() => account.value?.role === 'admin' && isAuthorized.value);

  async function loadAccount(user) {
    if (!user) {
      account.value = null;
      return;
    }
    let acc = await getAccountByEmail(user.email);
    if (!acc) {
      // 第一次登入自動建立未授權帳號
      const data = {
        accountId: user.email,
        email: user.email,
        name: user.displayName || '',
        phone: '',
        role: 'user',
        isAuthorized: false,
        createdAt: new Date().toISOString(),
      };
      await createAccount(user.uid, data);
      acc = { id: user.uid, ...data };
    }
    account.value = acc;
  }

  function init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        firebaseUser.value = user;
        try {
          await loadAccount(user);
        } catch (e) {
          error.value = e.message;
        } finally {
          loading.value = false;
          resolve();
        }
      });
    });
  }

  async function login() {
    error.value = '';
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      error.value = e.message;
      throw e;
    }
  }

  async function logout() {
    await signOut(auth);
    account.value = null;
    firebaseUser.value = null;
  }

  return {
    account, firebaseUser, loading, error,
    isLoggedIn, isAuthorized, isAdmin,
    init, login, logout,
  };
});
