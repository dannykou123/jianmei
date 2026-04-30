// useOrganizerAuth：團購人 Google 登入；首次登入自動建 Organizers/{uid}
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { ensureOrganizer, getOrganizer } from '@/services/organizers.service';

export const useOrganizerAuth = defineStore('organizerAuth', () => {
  const profile = ref(null);          // Organizers 文件
  const firebaseUser = ref(null);
  const loading = ref(true);
  const error = ref('');

  const isLoggedIn = computed(() => !!profile.value);
  const isProfileComplete = computed(() => {
    const p = profile.value;
    return !!(p && p.name && p.phone && p.company && p.address);
  });

  function init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        firebaseUser.value = user;
        try {
          if (user) {
            profile.value = await ensureOrganizer(user.uid, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            });
          } else {
            profile.value = null;
          }
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
      const result = await signInWithPopup(auth, googleProvider);
      // 直接載入 profile，不等 onAuthStateChanged callback
      const user = result.user;
      firebaseUser.value = user;
      profile.value = await ensureOrganizer(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } catch (e) {
      // 使用者主動取消 popup，靜默結束（不 re-throw，呼叫端視為未登入）
      const cancelled = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (cancelled.includes(e.code)) return;
      error.value = e.message;
      throw e;
    }
  }

  async function logout() {
    await signOut(auth);
    profile.value = null;
    firebaseUser.value = null;
  }

  async function refresh() {
    if (firebaseUser.value) {
      profile.value = await getOrganizer(firebaseUser.value.uid);
    }
  }

  return {
    profile, firebaseUser, loading, error,
    isLoggedIn, isProfileComplete,
    init, login, logout, refresh,
  };
});
