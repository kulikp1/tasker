<script setup lang="ts">
import { ref } from 'vue';
import { dragDebugLog, clearDragDebug } from '@/lib/dragDebug';

const open = ref(false);
</script>

<template>
  <div data-drag-debug-ui class="fixed bottom-16 left-2 z-[100] safe-bottom flex items-center gap-2">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-sm text-white shadow-lg"
      @click="open = !open"
    >
      🐞
    </button>
    <button
      v-if="open"
      type="button"
      class="flex h-9 items-center rounded-full bg-black/70 px-3 text-[11px] text-white shadow-lg"
      @click="clearDragDebug"
    >
      Очистити
    </button>
  </div>
  <div
    v-if="open"
    data-drag-debug-ui
    class="fixed bottom-28 left-2 z-[100] max-h-[50vh] w-[90vw] max-w-sm overflow-y-auto rounded-lg bg-black/90 p-2 font-mono text-[10px] leading-tight text-lime-300 shadow-xl"
  >
    <div v-for="(line, i) in dragDebugLog" :key="i">{{ line }}</div>
    <p v-if="dragDebugLog.length === 0" class="text-white/50">Поки що подій немає — спробуй потягнути таску.</p>
  </div>
</template>
