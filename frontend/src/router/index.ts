import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/', name: 'board', component: () => import('@/views/BoardView.vue') },
    { path: '/finance', name: 'finance', component: () => import('@/views/FinanceView.vue'), meta: { adminOnly: true } },
    { path: '/shopping', name: 'shopping', component: () => import('@/views/ShoppingView.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { adminOnly: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.initialized) {
    await auth.init();
  }
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'board' };
  }
  if (to.meta.adminOnly && !auth.isAdmin) {
    return { name: 'board' };
  }
  return true;
});

export default router;
