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

// Measured on the real device: visualViewport.offsetTop reads NEGATIVE (e.g. -68px) when this
// bug is active - iOS is painting the page 68px lower than where it tells `position: fixed`
// elements "bottom: 0" is, so a fixed nav ends up floating 68px above the real visible bottom
// edge. offsetTop is normally >= 0 (how far the visual viewport's top is scrolled down from the
// layout viewport's top); a negative value here is exactly that discrepancy, and it turns out to
// be the right amount to shift `bottom` by directly - so use it as-is (clamped to never push
// the nav the *other* direction, off-screen, if offsetTop is ever legitimately positive).
const navEl = ref<HTMLElement | null>(null);
const debugInfo = ref('measuring...');
onMounted(async () => {
  await nextTick();
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);

  function measure() {
    const vv = window.visualViewport;
    if (vv) {
      document.documentElement.style.setProperty('--nav-bottom-offset', Math.min(0, vv.offsetTop) + 'px');
    }
    if (!navEl.value) return;
    const rect = navEl.value.getBoundingClientRect();
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
  window.addEventListener('scroll', measure, { passive: true });
  window.visualViewport?.addEventListener('resize', measure);
  window.visualViewport?.addEventListener('scroll', measure);
});
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-16 z-[100] px-1 text-center font-mono text-[8px] leading-tight text-lime-400 sm:hidden">
    <span class="rounded bg-black/90 px-1 py-0.5">{{ debugInfo }}</span>
  </div>
  <nav
    ref="navEl"
    class="fixed inset-x-0 z-30 flex items-center justify-around safe-x border-t border-slate-200/70 bg-white/95 dark:border-white/10 dark:bg-[#0f0f16]/95 sm:hidden"
    style="bottom: var(--nav-bottom-offset, 0px); min-height: calc(3.5rem + 10px)"
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
