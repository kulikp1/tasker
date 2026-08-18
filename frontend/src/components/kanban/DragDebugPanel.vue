<script setup lang="ts">
import { ref } from 'vue';
import { dragDebugLog } from '@/lib/dragDebug';

const open = ref(false);
</script>

<template>
  <div class="fixed bottom-16 left-2 z-[100] safe-bottom">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-sm text-white shadow-lg"
      @click="open = !open"
    >
      🐞
    </button>
    <div
      v-if="open"
      class="mt-2 max-h-[50vh] w-[90vw] max-w-sm overflow-y-auto rounded-lg bg-black/90 p-2 font-mono text-[10px] leading-tight text-lime-300 shadow-xl"
    >
      <div v-for="(line, i) in dragDebugLog" :key="i">{{ line }}</div>
      <p v-if="dragDebugLog.length === 0" class="text-white/50">Поки що подій немає — спробуй потягнути таску.</p>
    </div>
  </div>
</template>
