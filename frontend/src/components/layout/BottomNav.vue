<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
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

// TEMPORARY diagnostic readout - the exact same layout has measured correctly (zero gap) in
// three separate test engines/scenarios, so the remaining discrepancy must be something real
// and specific to the actual phone that can't be reproduced remotely. This prints the raw
// numbers so they can just be read off the screen and reported back instead of guessed at.
const navEl = ref<HTMLElement | null>(null);
const debugInfo = ref('measuring...');
onMounted(async () => {
  await nextTick();
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);

  function measure() {
    if (!navEl.value) return;
    const rect = navEl.value.getBoundingClientRect();
    const vv = window.visualViewport;
    const safeBottom = getComputedStyle(probe).paddingBottom;
    debugInfo.value = [
      `innerH=${window.innerHeight}`,
      `navBottom=${rect.bottom.toFixed(1)}`,
      `gap=${(window.innerHeight - rect.bottom).toFixed(1)}`,
      `vvH=${vv ? vv.height.toFixed(1) : 'n/a'}`,
      `vvOffTop=${vv ? vv.offsetTop.toFixed(1) : 'n/a'}`,
      `dpr=${window.devicePixelRatio}`,
      `screenH=${window.screen.height}`,
      `safeBottom=${safeBottom}`,
    ].join(' ');
  }
  measure();
  window.addEventListener('resize', measure);
  window.visualViewport?.addEventListener('resize', measure);
});
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-16 z-[100] px-1 text-center font-mono text-[8px] leading-tight text-lime-400 sm:hidden">
    <span class="rounded bg-black/90 px-1 py-0.5">{{ debugInfo }}</span>
  </div>
  <nav
    ref="navEl"
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
