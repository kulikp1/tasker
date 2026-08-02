<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { categoricalPalette, inkColor, baseFont } from '@/lib/chartTheme';

const props = defineProps<{ items: Array<{ category: string; amount: number }> }>();

const chartData = computed(() => {
  const palette = categoricalPalette();
  return {
    labels: props.items.map((i) => i.category),
    datasets: [
      {
        data: props.items.map((i) => i.amount),
        backgroundColor: props.items.map((_, idx) => palette[idx % palette.length]),
        borderRadius: 6,
        barThickness: 22,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.x.toLocaleString('uk-UA')} ₴` } },
  },
  scales: {
    x: { grid: { color: inkColor('grid') }, ticks: { color: inkColor('muted'), font: baseFont } },
    y: { grid: { display: false }, ticks: { color: inkColor('secondary'), font: baseFont } },
  },
}));
</script>

<template>
  <div class="h-64">
    <Bar v-if="items.length > 0" :data="chartData" :options="chartOptions" />
    <p v-else class="flex h-full items-center justify-center text-sm text-slate-400">Немає даних</p>
  </div>
</template>
