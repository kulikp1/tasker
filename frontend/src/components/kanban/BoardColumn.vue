<script setup lang="ts">
import { computed, ref } from 'vue';
import draggable from 'vuedraggable';
import { Plus, Pencil, Trash2, Check, X, Flag } from 'lucide-vue-next';
import TaskCard from './TaskCard.vue';
import { useBoardStore } from '@/stores/board';
import { useConfirm } from '@/composables/useConfirm';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import type { Column, Task } from '@/api/types';

const props = defineProps<{ column: Column; index: number }>();
const emit = defineEmits<{ 'task-click': [Task]; 'add-task': [string] }>();

const board = useBoardStore();
const { confirm } = useConfirm();

const COLUMN_ACCENTS = ['#8b5cf6', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#06b6d4'];
const accent = computed(() => (props.column.isTerminal ? '#22c55e' : COLUMN_ACCENTS[props.index % COLUMN_ACCENTS.length]));

const editingTitle = ref(false);
const titleDraft = ref(props.column.title);

// Mirrors the working reference project's pattern exactly: v-model is a plain computed
// straight into the store (no local buffer ref, no "dragging" guard flag). vuedraggable
// hands the setter a new array on drop; re-stamping order/columnId on the same task objects
// mutates them in place, so the tasksByColumn getter naturally reflects the new order.
const tasks = computed<Task[]>({
  get: () => board.tasksByColumn(props.column._id),
  set: (value) => {
    value.forEach((t, index) => {
      t.order = index;
      t.columnId = props.column._id;
    });
  },
});

async function onChange(evt: any): Promise<void> {
  const changed = evt.added ?? evt.moved;
  if (!changed) return;
  const orderedIds = tasks.value.map((t) => t._id);
  try {
    await board.moveTask(changed.element._id, props.column._id, orderedIds);
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося перемістити таску'));
    await board.fetch();
  }
}

async function saveTitle(): Promise<void> {
  editingTitle.value = false;
  if (titleDraft.value.trim() && titleDraft.value.trim() !== props.column.title) {
    try {
      await board.renameColumn(props.column._id, titleDraft.value.trim());
      toast.success('Колонку перейменовано');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Не вдалося перейменувати колонку'));
    }
  } else {
    titleDraft.value = props.column.title;
  }
}

async function removeColumn(): Promise<void> {
  const ok = await confirm({
    title: 'Видалити колонку?',
    message: `Колонка «${props.column.title}» та всі таски в ній будуть видалені.`,
    danger: true,
    confirmText: 'Видалити',
  });
  if (!ok) return;
  try {
    await board.removeColumn(props.column._id);
    toast.success('Колонку видалено');
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося видалити колонку'));
  }
}

const countLabel = computed(() => `${tasks.value.length} tasks`);
</script>

<template>
  <div class="group flex h-full w-[85vw] shrink-0 snap-center flex-col sm:w-80 lg:min-w-[300px] lg:flex-1">
    <div class="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.02]">
      <!-- top accent glow -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-24" :style="{ background: `linear-gradient(to bottom, ${accent}20, transparent)` }" />

      <div class="relative flex shrink-0 items-center gap-2 px-4 pt-4">
        <template v-if="editingTitle">
          <input v-model="titleDraft" type="text" class="w-full rounded-lg border border-accent-300 bg-white/90 px-2 py-1 text-base font-semibold outline-none dark:bg-white/10" @keyup.enter="saveTitle" @keyup.esc="editingTitle = false" />
          <button class="touch-target rounded-full p-1 text-emerald-500" @click="saveTitle"><Check :size="16" /></button>
          <button class="touch-target rounded-full p-1 text-slate-400" @click="editingTitle = false; titleDraft = column.title"><X :size="16" /></button>
        </template>
        <template v-else>
          <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: accent }" />
          <span class="flex items-center gap-1.5 text-base font-bold text-slate-900 dark:text-white">
            {{ column.title }}
            <Flag v-if="column.isTerminal" :size="13" :style="{ color: accent }" />
          </span>
          <span class="ml-auto font-mono text-xs text-slate-400">{{ countLabel }}</span>
          <div class="flex items-center gap-0.5">
            <button class="touch-target rounded-full p-1.5 text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" @click="editingTitle = true"><Pencil :size="14" /></button>
            <button class="touch-target rounded-full p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500" @click="removeColumn"><Trash2 :size="14" /></button>
          </div>
        </template>
      </div>

      <draggable
        v-model="tasks"
        group="tasks"
        item-key="_id"
        ghost-class="opacity-40"
        class="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
        @change="onChange"
      >
        <template #item="{ element }">
          <div>
            <TaskCard :task="element" @click="emit('task-click', element)" />
          </div>
        </template>
      </draggable>

      <div class="relative shrink-0 p-3 pt-0">
        <button
          type="button"
          class="touch-target flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-accent-400 hover:text-accent-500 dark:border-white/15"
          @click="emit('add-task', column._id)"
        >
          <Plus :size="15" /> Додати таску
        </button>
      </div>
    </div>
  </div>
</template>
