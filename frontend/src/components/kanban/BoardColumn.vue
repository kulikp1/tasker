<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import draggable from 'vuedraggable';
// @ts-expect-error - sortablejs has no bundled types and this is a temporary debug-only import
import SortableJS from 'sortablejs';
import { Plus, Pencil, Trash2, Check, X, Flag } from 'lucide-vue-next';
import TaskCard from './TaskCard.vue';
import { useBoardStore } from '@/stores/board';
import { useConfirm } from '@/composables/useConfirm';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import { logDrag } from '@/lib/dragDebug';
import type { Column, Task } from '@/api/types';

const props = defineProps<{ column: Column; index: number }>();
const emit = defineEmits<{ 'task-click': [Task]; 'add-task': [string] }>();

const board = useBoardStore();
const { confirm } = useConfirm();

const COLUMN_ACCENTS = ['#8b5cf6', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#06b6d4'];
const accent = computed(() => (props.column.isTerminal ? '#22c55e' : COLUMN_ACCENTS[props.index % COLUMN_ACCENTS.length]));

const editingTitle = ref(false);
const titleDraft = ref(props.column.title);

// vuedraggable owns this array directly (splices it in place as the user drags), so it
// must be a real, stable ref - not a computed that hands back a freshly filtered/sorted
// array on every read, which fights vuedraggable's own DOM/array bookkeeping mid-drag.
// While a drag is in progress we stop pulling from the store so vuedraggable's own splice
// isn't clobbered by an unrelated store update landing in the middle of the gesture.
const localTasks = ref<Task[]>([]);
let dragging = false;

watch(
  () => board.tasksByColumn(props.column._id),
  (tasks) => {
    if (!dragging) localTasks.value = tasks;
  },
  { immediate: true }
);

const dragRoot = ref<{ $el: HTMLElement } | null>(null);
onMounted(async () => {
  await nextTick();
  const el = dragRoot.value?.$el;
  const attached = el ? Boolean(SortableJS.get(el)) : false;
  logDrag(`column="${props.column.title}" mounted, sortableAttached=${attached}`);
});

function onDragChoose(): void {
  logDrag(`sortable:choose column=${props.column.title}`);
}

function onDragUnchoose(): void {
  logDrag('sortable:unchoose');
}

function onDragStart(): void {
  logDrag(`sortable:start column=${props.column.title}`);
  dragging = true;
  board.dragging = true;
}

function onDragEnd(): void {
  logDrag('sortable:end');
  dragging = false;
  board.dragging = false;
  localTasks.value = board.tasksByColumn(props.column._id);
}

async function onChange(evt: any): Promise<void> {
  logDrag('sortable:change');
  const changed = evt.added ?? evt.moved;
  if (!changed) return;
  const orderedIds = localTasks.value.map((t) => t._id);
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

const taskCount = computed(() => localTasks.value.length);
const countLabel = computed(() => `${taskCount.value} tasks`);
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

      <div class="relative min-h-0 flex-1 overflow-y-auto p-3">
        <draggable
          ref="dragRoot"
          v-model="localTasks"
          group="tasks"
          item-key="_id"
          animation="200"
          ghost-class="opacity-40"
          chosen-class="ring-2 ring-accent-400 shadow-xl"
          class="flex min-h-full flex-col gap-3"
          @choose="onDragChoose"
          @unchoose="onDragUnchoose"
          @start="onDragStart"
          @end="onDragEnd"
          @change="onChange"
        >
          <template #item="{ element }">
            <TaskCard :task="element" @click="emit('task-click', element)" />
          </template>
        </draggable>
      </div>

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
