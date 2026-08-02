<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { statusColor, inkColor, baseFont } from '@/lib/chartTheme';

const props = defineProps<{ items: Array<{ date: string; spent: number; income: number }> }>();

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

const chartData = computed(() => ({
  labels: props.items.map((i) => formatDate(i.date)),
  datasets: [
    {
      label: 'Витрати',
      data: props.items.map((i) => i.spent),
      borderColor: statusColor('critical'),
      backgroundColor: statusColor('critical') + '22',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.35,
      fill: true,
    },
    {
      label: 'Надходження',
      data: props.items.map((i) => i.income),
      borderColor: statusColor('good'),
      backgroundColor: statusColor('good') + '22',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.35,
      fill: true,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: inkColor('secondary'), font: baseFont, boxWidth: 10, boxHeight: 10 } },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('uk-UA')} ₴` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: inkColor('muted'), font: baseFont, maxRotation: 0, autoSkip: true } },
    y: { grid: { color: inkColor('grid') }, ticks: { color: inkColor('muted'), font: baseFont } },
  },
}));
</script>

<template>
  <div class="h-72">
    <Line v-if="items.length > 0" :data="chartData" :options="chartOptions" />
    <p v-else class="flex h-full items-center justify-center text-sm text-slate-400">Немає даних за період</p>
  </div>
</template>
