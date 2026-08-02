<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Sun, Moon, LayoutGrid, Wallet, ShoppingBag, ShieldCheck, LogOut, Check } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useShoppingStore } from '@/stores/shopping';
import Avatar from '@/components/common/Avatar.vue';
import NotificationBell from './NotificationBell.vue';
import ProfileModal from './ProfileModal.vue';
import { toast } from '@/lib/toast';

const auth = useAuthStore();
const ui = useUiStore();
const shopping = useShoppingStore();
const route = useRoute();
const profileOpen = ref(false);

const shoppingBadge = computed(() => shopping.activeLists.length);
const roleLabel = computed(() => (auth.isAdmin ? 'OWNER' : 'MEMBER'));

const navItems = computed(() => [
  { name: 'board', to: '/', label: 'Канбан', icon: LayoutGrid, badge: 0 },
  ...(auth.isAdmin ? [{ name: 'finance', to: '/finance', label: 'Фінанси', icon: Wallet, badge: 0 }] : []),
  { name: 'shopping', to: '/shopping', label: 'Покупки', icon: ShoppingBag, badge: shoppingBadge.value },
]);

async function onLogout(): Promise<void> {
  await auth.logout();
  toast.info('Ви вийшли з акаунту');
}
</script>

<template>
  <header class="sticky top-0 z-30 safe-top px-3 pt-3 sm:px-4">
    <div class="mx-auto flex h-16 max-w-[1400px] items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-3 backdrop-blur-glass dark:border-white/[0.08] dark:bg-white/[0.04] sm:gap-4 sm:px-4">
      <RouterLink to="/" class="flex items-center gap-2.5">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow">
          <Check :size="22" :stroke-width="3" />
        </span>
        <span class="hidden leading-none sm:block">
          <span class="block text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">Tasker</span>
          <span class="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Home Team</span>
        </span>
      </RouterLink>

      <nav class="ml-1 hidden items-center gap-1 rounded-2xl bg-slate-100/70 p-1 dark:bg-black/20 sm:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="touch-target relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
          :class="route.name === item.name ? 'bg-accent-500 text-white shadow-glow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
          <span v-if="item.badge > 0" class="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold" :class="route.name === item.name ? 'bg-white/25 text-white' : 'bg-accent-500/15 text-accent-500 dark:text-accent-300'">{{ item.badge }}</span>
        </RouterLink>
        <RouterLink
          v-if="auth.isAdmin"
          to="/admin"
          class="touch-target flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
          :class="route.name === 'admin' ? 'bg-accent-500 text-white shadow-glow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
        >
          <ShieldCheck :size="16" /> Admin
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" @click="ui.toggleTheme">
          <Sun v-if="ui.theme === 'dark'" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <NotificationBell />
        <button type="button" class="touch-target flex items-center gap-2.5 rounded-xl border border-slate-200/70 py-1 pl-1 pr-1 transition-colors hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10 sm:pr-3.5" @click="profileOpen = true">
          <Avatar :src="auth.user?.avatarUrl" :name="auth.user?.username ?? '?'" :size="32" />
          <span class="hidden leading-none sm:block">
            <span class="block text-sm font-semibold text-slate-800 dark:text-slate-100">{{ auth.user?.username }}</span>
            <span class="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{{ roleLabel }}</span>
          </span>
        </button>
        <button type="button" class="touch-target hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-500 dark:border-white/10 dark:text-slate-400 sm:flex" title="Вийти" @click="onLogout">
          <LogOut :size="18" />
        </button>
      </div>
    </div>
  </header>

  <ProfileModal v-model="profileOpen" />
</template>
