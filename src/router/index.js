// Vue Router：organizer / customer + 中性 landing + 404
// 後台管理系統改用 legacy HTML（admin.html），不走 Vue Router
import { createRouter, createWebHistory } from 'vue-router';
import { useOrganizerAuth } from '@/stores/useOrganizerAuth';

const routes = [
  { path: '/', name: 'landing', component: () => import('@/pages/LandingNotice.vue') },

  // ── Organizer 團購人 ────────────────────────
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

  // ── Customer 訂購人公開頁 ───────────────────
  // :organizerId = 團購人的 Firebase UID（固定不變的永久網址）
  {
    path: '/order/:organizerId',
    name: 'customer-order',
    component: () => import('@/pages/customer/CustomerOrder.vue'),
    props: true,
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
];

// 使用 import.meta.env.BASE_URL 讓 Vite build 時自動帶入正確的 base 路徑
// GitHub Pages: /jianmei/，Firebase Hosting: /
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
});

export default router;
