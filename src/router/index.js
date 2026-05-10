import { createRouter, createWebHistory } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';
import { useAdminAuth } from '@/stores/useAdminAuth';

const routes = [
  { path: '/', name: 'landing', component: () => import('@/pages/LandingNotice.vue') },

  // ── Organizer 團購人 ────────────────────────────────────────────
  {
    path: '/organizer/login',
    name: 'organizer-login',
    component: () => import('@/pages/organizer/OrganizerLogin.vue'),
  },
  {
    path: '/organizer',
    component: () => import('@/pages/organizer/OrganizerLayout.vue'),
    meta: { requiresOrganizerAuth: true },
    children: [
      { path: '', name: 'organizer-home', component: () => import('@/pages/organizer/OrganizerHome.vue') },
      { path: 'profile', name: 'organizer-profile', component: () => import('@/pages/organizer/OrganizerProfile.vue') },
      { path: 'session/new', name: 'organizer-session-new', component: () => import('@/pages/organizer/SessionEditor.vue') },
      { path: 'session/:id', name: 'organizer-session', component: () => import('@/pages/organizer/SessionDetail.vue'), props: true },
      { path: 'session/:id/edit', name: 'organizer-session-edit', component: () => import('@/pages/organizer/SessionEditor.vue'), props: true },
    ],
  },

  // ── Admin 後台 ──────────────────────────────────────────────────
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/pages/admin/AdminLogin.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/pages/admin/AdminLayout.vue'),
    meta: { requiresAdminAuth: true },
    children: [
      { path: '', redirect: '/admin/review' },
      { path: 'review',        name: 'admin-review',        component: () => import('@/pages/admin/AdminReview.vue') },
      { path: 'details',       name: 'admin-details',       component: () => import('@/pages/admin/AdminDetails.vue') },
      { path: 'contacts',      name: 'admin-contacts',      component: () => import('@/pages/admin/AdminContacts.vue') },
      { path: 'items',         name: 'admin-items',         component: () => import('@/pages/admin/AdminItems.vue') },
      { path: 'accounts',      name: 'admin-accounts',      component: () => import('@/pages/admin/AdminAccounts.vue') },
      { path: 'analytics',     name: 'admin-analytics',     component: () => import('@/pages/admin/AdminAnalytics.vue') },
      { path: 'more',          name: 'admin-more',          component: () => import('@/pages/admin/AdminMore.vue') },
      { path: 'line-settings', name: 'admin-line-settings', component: () => import('@/pages/admin/AdminLineSettings.vue') },
    ],
  },

  // ── Customer 訂購人公開頁 ───────────────────────────────────────
  {
    path: '/order/:organizerId',
    name: 'customer-order',
    component: () => import('@/pages/customer/CustomerOrder.vue'),
    props: true,
  },

  // ── LINE LIFF 頁面 ──────────────────────────────────────────────
  // LIFF Endpoint URL 設定為：https://your-domain.com/line/order-status
  // 攜帶 ?token=xxx 時執行綁定；否則顯示帳號狀態
  {
    path: '/line/order-status',
    name: 'line-order-status',
    component: () => import('@/pages/customer/LineOrderStatus.vue'),
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  if (to.meta.requiresOrganizerAuth) {
    const store = useOrganizerAuth();
    if (store.loading) await store.init();
    if (!store.isLoggedIn) return { name: 'organizer-login', query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdminAuth) {
    const store = useAdminAuth();
    if (store.loading) await store.init();
    if (!store.isLoggedIn) return { name: 'admin-login', query: { redirect: to.fullPath } };
    if (!store.isAuthorized) return { name: 'admin-login' };
  }
});

export default router;
