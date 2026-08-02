<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import BoardColumn from '@/components/kanban/BoardColumn.vue';
import TaskModal from '@/components/kanban/TaskModal.vue';
import Modal from '@/components/common/Modal.vue';
import { useBoardStore } from '@/stores/board';
import { usePeopleStore } from '@/stores/people';
import { useRealtimeStore } from '@/stores/realtime';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import type { Task } from '@/api/types';

const board = useBoardStore();
const people = usePeopleStore();
const realtime = useRealtimeStore();

const taskModalOpen = ref(false);
const activeTask = ref<Task | null>(null);
const activeColumnId = ref<string>('');
const addingColumn = ref(false);
const newColumnTitle = ref('');

let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await Promise.all([board.fetch(), people.fetch()]);
  unsubscribe = realtime.onBoardUpdated(() => board.fetch());
});
onUnmounted(() => unsubscribe?.());

function openNewTask(columnId: string): void {
  activeTask.value = null;
  activeColumnId.value = columnId;
  taskModalOpen.value = true;
}
function openTask(task: Task): void {
  activeTask.value = task;
  taskModalOpen.value = true;
}

async function addColumn(): Promise<void> {
  if (!newColumnTitle.value.trim()) return;
  try {
    await board.addColumn(newColumnTitle.value.trim());
    toast.success('Колонку створено');
    newColumnTitle.value = '';
    addingColumn.value = false;
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося створити колонку'));
  }
}
</script>

<template>
  <div class="mx-auto flex h-full max-w-[1400px] flex-col px-4 sm:px-6">
    <div class="flex shrink-0 items-center justify-between pt-6 pb-4">
      <h1 class="font-display text-5xl font-bold leading-none text-slate-900 dark:text-white">Kanban-дошка</h1>
      <button
        type="button"
        title="Нова колонка"
        class="touch-target flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-glow transition-all hover:bg-accent-600 hover:scale-105"
        @click="addingColumn = true"
      >
        <Plus :size="22" />
      </button>
    </div>

    <div class="flex min-h-0 flex-1 gap-5 overflow-x-auto pb-6 snap-x snap-mandatory sm:snap-none">
      <BoardColumn v-for="(col, i) in board.sortedColumns" :key="col._id" :column="col" :index="i" @task-click="openTask" @add-task="openNewTask" />
    </div>

    <Modal v-model="addingColumn" title="Нова колонка" size="sm">
      <input
        v-model="newColumnTitle"
        type="text"
        autofocus
        placeholder="Назва колонки"
        class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400"
        @keyup.enter="addColumn"
      />
      <template #footer>
        <button type="button" class="touch-target rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-black/5 dark:hover:bg-white/10" @click="addingColumn = false">Скасувати</button>
        <button type="button" class="touch-target rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600" @click="addColumn">Створити</button>
      </template>
    </Modal>

    <TaskModal v-model="taskModalOpen" :task="activeTask" :default-column-id="activeColumnId" />
  </div>
</template>
