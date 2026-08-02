<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { statusColor, inkColor, baseFont } from '@/lib/chartTheme';

const props = defineProps<{ items: Array<{ month: string; spent: number; income: number }> }>();

function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' });
}

const chartData = computed(() => ({
  labels: props.items.map((i) => formatMonth(i.month)),
  datasets: [
    { label: 'Витрати', data: props.items.map((i) => i.spent), backgroundColor: statusColor('critical'), borderRadius: 4 },
    { label: 'Надходження', data: props.items.map((i) => i.income), backgroundColor: statusColor('good'), borderRadius: 4 },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: inkColor('secondary'), font: baseFont, boxWidth: 10, boxHeight: 10 } },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('uk-UA')} ₴` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: inkColor('muted'), font: baseFont } },
    y: { grid: { color: inkColor('grid') }, ticks: { color: inkColor('muted'), font: baseFont } },
  },
}));
</script>

<template>
  <div class="h-72">
    <Bar v-if="items.length > 0" :data="chartData" :options="chartOptions" />
    <p v-else class="flex h-full items-center justify-center text-sm text-slate-400">Немає даних</p>
  </div>
</template>
