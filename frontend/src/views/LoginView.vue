<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Check } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const overlayEl = ref<HTMLElement | null>(null);
const overlayWrap = ref<HTMLElement | null>(null);

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не вдалося завантажити Google Sign-In'));
    document.head.appendChild(script);
  });
}

async function onCredential(response: { credential: string }): Promise<void> {
  try {
    await auth.loginWithGoogle(response.credential);
    toast.success(`Вітаємо, ${auth.user?.username}!`);
    router.replace((route.query.redirect as string) || '/');
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося увійти'));
  }
}

onMounted(async () => {
  try {
    await loadGoogleScript();
    window.google!.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: onCredential,
    });
    if (overlayEl.value && overlayWrap.value) {
      const width = Math.round(overlayWrap.value.getBoundingClientRect().width);
      window.google!.accounts.id.renderButton(overlayEl.value, { type: 'standard', theme: 'outline', size: 'large', width, locale: 'uk' });
    }
  } catch {
    toast.error('Не вдалося завантажити Google Sign-In. Перевірте з’єднання і оновіть сторінку.');
  }
});
</script>

<template>
  <div class="relative flex h-dvh items-center justify-center overflow-hidden safe-x px-4">
    <div class="pointer-events-none absolute inset-0 bg-surface-light dark:bg-surface-dark" />
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
      style="background: radial-gradient(circle, rgba(124, 58, 237, 0.35), transparent 70%)"
    />
    <div v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { duration: 350 } }" class="glass relative w-full max-w-sm rounded-3xl p-8">
      <div class="mb-7 text-center">
        <span
          class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow"
        >
          <Check :size="30" :stroke-width="3" />
        </span>
        <h1 class="mt-4 font-display text-4xl font-bold leading-none text-slate-900 dark:text-white">Tasker</h1>
        <p class="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Home Team</p>
      </div>
      <div class="flex flex-col items-center gap-3">
        <div ref="overlayWrap" class="relative w-full">
          <button
            type="button"
            tabindex="-1"
            class="touch-target pointer-events-none flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition-shadow dark:border-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Увійти через Google
          </button>
          <div ref="overlayEl" class="absolute inset-0 overflow-hidden rounded-xl opacity-0" />
        </div>
        <p class="text-center text-xs text-slate-400">Увійти можна лише запрошеною поштою.</p>
      </div>
    </div>
  </div>
</template>
