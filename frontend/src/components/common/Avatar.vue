<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  src?: string;
  name: string;
  size?: number;
  online?: boolean;
}>();

const initials = computed(() =>
  props.name
    .trim()
    .slice(0, 2)
    .toUpperCase()
);

const dimension = computed(() => `${props.size ?? 36}px`);
</script>

<template>
  <span class="relative inline-flex shrink-0" :style="{ width: dimension, height: dimension }">
    <img v-if="src" :src="src" :alt="name" class="h-full w-full rounded-full object-cover ring-2 ring-white/50 dark:ring-white/10" />
    <span v-else class="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-semibold text-white ring-2 ring-white/50 dark:ring-white/10">
      {{ initials }}
    </span>
    <span
      v-if="online !== undefined"
      class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-surface-dark"
      :class="online ? 'bg-mint-400' : 'bg-slate-400'"
    />
  </span>
</template>
