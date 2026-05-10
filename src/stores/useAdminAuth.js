import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  signInWithPopup, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { getAccountById, createAccount } from '@/services/accounts.service';

export const useAdminAuth = defineStore('adminAuth', () => {
  const account = ref(null);
  const firebaseUser = ref(null);
  const loading = ref(true);
  const error = ref('');

  const isLoggedIn   = computed(() => !!account.value);
  const isAuthorized = computed(() => account.value?.isAuthorized === true);
  const isAdmin      = computed(() => account.value?.role === 'admin' && isAuthorized.value);

  async function loadAccount(user) {
    if (!user) { account.value = null; return; }
    let acc = await getAccountById(user.uid);
    if (!acc) {
      const data = {
        accountId:    user.email,
        email:        user.email,
        name:         user.displayName || '',
        phone:        '',
        role:         'user',
        isAuthorized: false,
        createdAt:    new Date().toISOString(),
      };
      await createAccount(user.uid, data);
      acc = { id: user.uid, ...data };
    }
    account.value = acc;
  }

  // _loginResolve / _loginReject 讓 login() 等待 onAuthStateChanged 內的 loadAccount 完成
  let _unsubAuth    = null;
  let _loginResolve = null;
  let _loginReject  = null;

  function init() {
    if (_unsubAuth) return Promise.resolve();
    return new Promise((resolve) => {
      _unsubAuth = onAuthStateChanged(auth, async (user) => {
        firebaseUser.value = user;
        try {
          // Firestore 呼叫在此回調內執行，auth token 已完全同步
          await loadAccount(user);
          _loginResolve?.();
        } catch (e) {
          error.value = e.message;
          _loginReject?.(e);
        } finally {
          _loginResolve = null;
          _loginReject  = null;
          loading.value = false;
          resolve(); // init() Promise 在首次回調後 resolve
        }
      });
    });
  }

  async function login() {
    error.value = '';
    // 確保 onAuthStateChanged 已註冊，並等待初始 auth 狀態載入完畢
    await init();
    try {
      // 先建立等待 promise，再觸發 signInWithPopup
      const whenLoaded = new Promise((resolve, reject) => {
        _loginResolve = resolve;
        _loginReject  = reject;
      });
      await signInWithPopup(auth, googleProvider);
      // 等待 onAuthStateChanged 回調完成 loadAccount（token 已同步）
      await whenLoaded;
    } catch (e) {
      _loginResolve = null;
      _loginReject  = null;
      error.value = e.message;
      throw e;
    }
  }

  async function logout() {
    await signOut(auth);
    account.value      = null;
    firebaseUser.value = null;
  }

  return {
    account, firebaseUser, loading, error,
    isLoggedIn, isAuthorized, isAdmin,
    init, login, logout,
  };
});
