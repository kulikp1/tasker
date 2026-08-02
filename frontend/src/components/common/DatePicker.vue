<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next';
import Modal from './Modal.vue';

const props = defineProps<{ modelValue?: string | null; label?: string }>();
const emit = defineEmits<{ 'update:modelValue': [string | null] }>();

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const open = ref(false);
const today = new Date();
const initial = props.modelValue ? new Date(props.modelValue) : today;
const viewYear = ref(initial.getFullYear());
const viewMonth = ref(initial.getMonth());

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const displayLabel = computed(() => {
  if (!props.modelValue) return 'Оберіть дату';
  const d = new Date(props.modelValue);
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
});

const grid = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(viewYear.value, viewMonth.value, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return {
      date,
      iso: toIso(date),
      inMonth: date.getMonth() === viewMonth.value,
      isToday: toIso(date) === toIso(today),
      isSelected: props.modelValue ? toIso(date) === props.modelValue : false,
    };
  });
});

function prevMonth(): void {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  } else {
    viewMonth.value -= 1;
  }
}
function nextMonth(): void {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  } else {
    viewMonth.value += 1;
  }
}
function select(iso: string): void {
  emit('update:modelValue', iso);
  open.value = false;
}
function clear(): void {
  emit('update:modelValue', null);
  open.value = false;
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{{ label }}</label>
    <button
      type="button"
      class="touch-target flex w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-left text-sm transition-colors hover:border-accent-400"
      @click="open = true"
    >
      <CalendarDays :size="17" class="text-accent-500 shrink-0" />
      <span :class="modelValue ? '' : 'text-slate-400'">{{ displayLabel }}</span>
    </button>

    <Modal v-model="open" size="sm" title="Оберіть дату">
      <div class="flex items-center justify-between mb-3">
        <button type="button" class="touch-target rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10" @click="prevMonth">
          <ChevronLeft :size="18" />
        </button>
        <span class="text-sm font-semibold">{{ MONTHS[viewMonth] }} {{ viewYear }}</span>
        <button type="button" class="touch-target rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10" @click="nextMonth">
          <ChevronRight :size="18" />
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
        <span v-for="d in WEEKDAYS" :key="d">{{ d }}</span>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="cell in grid"
          :key="cell.iso"
          type="button"
          class="touch-target aspect-square rounded-lg text-sm transition-colors"
          :class="[
            cell.inMonth ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600',
            cell.isSelected ? 'bg-accent-500 text-white font-semibold' : 'hover:bg-accent-100 dark:hover:bg-white/10',
            cell.isToday && !cell.isSelected ? 'ring-1 ring-accent-400' : '',
          ]"
          @click="select(cell.iso)"
        >
          {{ cell.date.getDate() }}
        </button>
      </div>
      <template #footer>
        <button type="button" class="touch-target rounded-xl px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10" @click="clear">Очистити</button>
      </template>
    </Modal>
  </div>
</template>
