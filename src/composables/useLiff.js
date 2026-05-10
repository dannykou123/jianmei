// LIFF（LINE Front-end Framework）初始化 composable
// 動態載入 LIFF SDK，封裝常用操作

import { ref, readonly } from 'vue';

const LIFF_SDK_URL = 'https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js';

const isLiffReady = ref(false);
const liffProfile = ref(null); // { userId, displayName, pictureUrl }
const isInLineClient = ref(false);

let initPromise = null;

/**
 * 初始化 LIFF
 * @param {string} liffId - LIFF App ID（從 LINE Developer Console 取得）
 * @returns {Promise<boolean>} 是否在 LINE App 內開啟
 */
async function initLiff(liffId) {
  if (!liffId) {
    console.warn('[useLiff] liffId 未提供，跳過 LIFF 初始化');
    return false;
  }

  // 防止重複初始化
  if (initPromise) return initPromise;

  initPromise = _doInit(liffId);
  return initPromise;
}

async function _doInit(liffId) {
  // 動態載入 SDK（避免影響不使用 LIFF 的頁面）
  await _loadSdk();

  const liff = window.liff;
  await liff.init({ liffId });

  isLiffReady.value = true;
  isInLineClient.value = liff.isInClient();

  if (liff.isLoggedIn()) {
    try {
      const profile = await liff.getProfile();
      liffProfile.value = {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      };
    } catch (err) {
      console.warn('[useLiff] 取得 Profile 失敗:', err);
    }
  }

  return isInLineClient.value;
}

/**
 * 動態注入 LIFF SDK script 標籤
 */
function _loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.liff) {
      resolve();
      return;
    }
    // 避免重複注入
    if (document.querySelector(`script[src="${LIFF_SDK_URL}"]`)) {
      const existing = document.querySelector(`script[src="${LIFF_SDK_URL}"]`);
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = LIFF_SDK_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('LIFF SDK 載入失敗'));
    document.head.appendChild(script);
  });
}

/**
 * 取得 LINE userId（需先 initLiff 且已登入）
 * @returns {string|null}
 */
function getLineUserId() {
  return liffProfile.value?.userId ?? null;
}

/**
 * 在 LINE App 內觸發 LINE 登入（非 LINE 環境無效）
 */
function loginWithLine() {
  if (window.liff && !window.liff.isLoggedIn()) {
    window.liff.login({ redirectUri: window.location.href });
  }
}

/**
 * 關閉 LIFF 視窗（僅在 LINE App 內有效）
 */
function closeLiff() {
  if (window.liff && window.liff.isInClient()) {
    window.liff.closeWindow();
  }
}

export function useLiff() {
  return {
    isLiffReady: readonly(isLiffReady),
    liffProfile: readonly(liffProfile),
    isInLineClient: readonly(isInLineClient),
    initLiff,
    getLineUserId,
    loginWithLine,
    closeLiff,
  };
}
