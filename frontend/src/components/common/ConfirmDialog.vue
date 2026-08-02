<script setup lang="ts">
import { AlertTriangle, HelpCircle } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { confirmState, resolveConfirm } from '@/composables/useConfirm';
</script>

<template>
  <Modal :model-value="confirmState.visible" size="sm" persistent @update:model-value="(v) => !v && resolveConfirm(false)">
    <div class="flex flex-col items-center gap-4 py-1 text-center">
      <span
        class="relative flex h-16 w-16 items-center justify-center rounded-2xl"
        :class="confirmState.danger ? 'bg-red-500/10 text-red-500' : 'bg-accent-500/10 text-accent-500'"
      >
        <span
          class="pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-xl"
          :class="confirmState.danger ? 'bg-red-500/20' : 'bg-accent-500/20'"
        />
        <AlertTriangle v-if="confirmState.danger" :size="30" :stroke-width="2" />
        <HelpCircle v-else :size="30" :stroke-width="2" />
      </span>
      <div>
        <h3 class="font-display text-2xl font-bold leading-tight text-slate-900 dark:text-white">{{ confirmState.title }}</h3>
        <p v-if="confirmState.message" class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{{ confirmState.message }}</p>
      </div>
    </div>
    <template #footer>
      <button
        class="touch-target flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
        @click="resolveConfirm(false)"
      >
        {{ confirmState.cancelText }}
      </button>
      <button
        class="touch-target flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors"
        :class="confirmState.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-500 hover:bg-accent-600'"
        @click="resolveConfirm(true)"
      >
        {{ confirmState.confirmText }}
      </button>
    </template>
  </Modal>
</template>
