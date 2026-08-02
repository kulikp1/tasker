<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 16 });
</script>

<template>
  <span
    class="inline-block shrink-0 animate-spin rounded-full"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      background: 'conic-gradient(from 0deg, transparent 0%, transparent 55%, currentColor 100%)',
      WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(2, Math.round(size / 7))}px), #000 calc(100% - ${Math.max(2, Math.round(size / 7))}px))`,
      mask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(2, Math.round(size / 7))}px), #000 calc(100% - ${Math.max(2, Math.round(size / 7))}px))`,
    }"
  />
</template>
