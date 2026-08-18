<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { LayoutGrid, Wallet, ShoppingBasket, ShieldCheck } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

const items = computed(() => [
  { name: 'board', to: '/', label: 'Канбан', icon: LayoutGrid },
  ...(auth.isAdmin ? [{ name: 'finance', to: '/finance', label: 'Фінанси', icon: Wallet }] : []),
  { name: 'shopping', to: '/shopping', label: 'Покупки', icon: ShoppingBasket },
]);
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around safe-x border-t border-slate-200/70 bg-white/95 dark:border-white/10 dark:bg-[#0f0f16]/95 sm:hidden"
    style="min-height: calc(3.5rem + 10px)"
  >
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="item.to"
      class="touch-target flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors"
      :class="route.name === item.name ? 'text-accent-500' : 'text-slate-400'"
    >
      <component :is="item.icon" :size="19" />
      {{ item.label }}
    </RouterLink>
    <RouterLink
      v-if="auth.isAdmin"
      to="/admin"
      class="touch-target flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors"
      :class="route.name === 'admin' ? 'text-accent-500' : 'text-slate-400'"
    >
      <ShieldCheck :size="19" />
      Admin
    </RouterLink>
  </nav>
</template>
