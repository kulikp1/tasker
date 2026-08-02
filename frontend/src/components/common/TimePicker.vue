<script setup lang="ts">
import { computed, ref } from 'vue';
import { Clock } from 'lucide-vue-next';
import Modal from './Modal.vue';

const props = defineProps<{ modelValue?: string | null; label?: string }>();
const emit = defineEmits<{ 'update:modelValue': [string | null] }>();

const open = ref(false);
const [initHour, initMinute] = (props.modelValue ?? '12:00').split(':').map(Number);
const hour = ref(Number.isFinite(initHour) ? initHour : 12);
const minute = ref(Number.isFinite(initMinute) ? Math.round(initMinute / 5) * 5 : 0);

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

const displayLabel = computed(() => (props.modelValue ? props.modelValue : 'Оберіть час'));

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function apply(): void {
  emit('update:modelValue', `${pad(hour.value)}:${pad(minute.value)}`);
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
      <Clock :size="17" class="text-accent-500 shrink-0" />
      <span :class="modelValue ? '' : 'text-slate-400'">{{ displayLabel }}</span>
    </button>

    <Modal v-model="open" size="sm" title="Оберіть час">
      <div class="flex justify-center gap-4">
        <div class="h-56 w-20 overflow-y-auto rounded-xl bg-black/[0.03] dark:bg-white/5 p-1 snap-y snap-mandatory">
          <button
            v-for="h in hours"
            :key="h"
            type="button"
            class="touch-target block w-full snap-center rounded-lg py-2.5 text-center text-sm transition-colors"
            :class="h === hour ? 'bg-accent-500 text-white font-semibold' : 'hover:bg-accent-100 dark:hover:bg-white/10'"
            @click="hour = h"
          >
            {{ pad(h) }}
          </button>
        </div>
        <div class="h-56 w-20 overflow-y-auto rounded-xl bg-black/[0.03] dark:bg-white/5 p-1 snap-y snap-mandatory">
          <button
            v-for="m in minutes"
            :key="m"
            type="button"
            class="touch-target block w-full snap-center rounded-lg py-2.5 text-center text-sm transition-colors"
            :class="m === minute ? 'bg-accent-500 text-white font-semibold' : 'hover:bg-accent-100 dark:hover:bg-white/10'"
            @click="minute = m"
          >
            {{ pad(m) }}
          </button>
        </div>
      </div>
      <template #footer>
        <button type="button" class="touch-target rounded-xl px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10" @click="clear">Очистити</button>
        <button type="button" class="touch-target rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600" @click="apply">Готово</button>
      </template>
    </Modal>
  </div>
</template>
