<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { categoricalPalette, foldToTop, inkColor, baseFont } from '@/lib/chartTheme';

const props = defineProps<{ items: Array<{ category: string; amount: number }> }>();

const folded = computed(() => foldToTop(props.items));

const chartData = computed(() => {
  const palette = categoricalPalette();
  return {
    labels: folded.value.map((i) => i.category),
    datasets: [
      {
        data: folded.value.map((i) => i.amount),
        backgroundColor: folded.value.map((_, idx) => palette[idx % palette.length]),
        borderWidth: 2,
        borderColor: document.documentElement.classList.contains('dark') ? '#1a1a19' : '#fcfcfb',
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: inkColor('secondary'), font: baseFont, boxWidth: 10, boxHeight: 10, padding: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed.toLocaleString('uk-UA')} ₴`,
      },
    },
  },
}));
</script>

<template>
  <div class="h-72">
    <Doughnut v-if="folded.length > 0" :data="chartData" :options="chartOptions" />
    <p v-else class="flex h-full items-center justify-center text-sm text-slate-400">Немає даних за період</p>
  </div>
</template>
