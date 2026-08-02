<script setup lang="ts">
defineProps<{ label: string; value: string; tone?: 'good' | 'critical' | 'neutral' }>();
</script>

<template>
  <div class="glass rounded-2xl p-4">
    <p class="text-xs text-slate-400">{{ label }}</p>
    <p
      class="mt-1 text-xl font-bold tabular-nums tracking-tight"
      :class="{ 'text-emerald-500': tone === 'good', 'text-rose-500': tone === 'critical' }"
    >
      {{ value }}
    </p>
  </div>
</template>
