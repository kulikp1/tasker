import { defineStore } from 'pinia';
import * as api from '@/api/board';
import type { Column, Task } from '@/api/types';
import type { TaskInput } from '@/api/board';

export const useBoardStore = defineStore('board', {
  state: () => ({
    columns: [] as Column[],
    tasks: [] as Task[],
    loaded: false,
  }),
  getters: {
    tasksByColumn: (state) => (columnId: string) =>
      state.tasks.filter((t) => t.columnId === columnId).sort((a, b) => a.order - b.order),
    sortedColumns: (state) => [...state.columns].sort((a, b) => a.order - b.order),
  },
  actions: {
    async fetch(): Promise<void> {
      const { data } = await api.fetchBoard();
      this.columns = data.columns;
      this.tasks = data.tasks;
      this.loaded = true;
    },
    async addColumn(title: string, isTerminal = false): Promise<void> {
      const { data } = await api.createColumn(title, isTerminal);
      this.columns.push(data.column);
    },
    async renameColumn(id: string, title: string): Promise<void> {
      const { data } = await api.updateColumn(id, { title });
      const idx = this.columns.findIndex((c) => c._id === id);
      if (idx !== -1) this.columns[idx] = data.column;
    },
    async removeColumn(id: string): Promise<void> {
      await api.deleteColumn(id);
      this.columns = this.columns.filter((c) => c._id !== id);
      this.tasks = this.tasks.filter((t) => t.columnId !== id);
    },
    async createTask(input: TaskInput): Promise<Task> {
      const { data } = await api.createTask(input);
      this.tasks.push(data.task);
      return data.task;
    },
    async editTask(id: string, input: Partial<TaskInput>): Promise<Task> {
      const { data } = await api.updateTask(id, input);
      const idx = this.tasks.findIndex((t) => t._id === id);
      if (idx !== -1) this.tasks[idx] = data.task;
      return data.task;
    },
    async removeTask(id: string): Promise<void> {
      await api.deleteTask(id);
      this.tasks = this.tasks.filter((t) => t._id !== id);
    },
    async moveTask(taskId: string, toColumnId: string, orderedTaskIds: string[]): Promise<void> {
      const task = this.tasks.find((t) => t._id === taskId);
      if (task) task.columnId = toColumnId;
      orderedTaskIds.forEach((id, index) => {
        const t = this.tasks.find((tt) => tt._id === id);
        if (t) t.order = index;
      });
      await api.moveTask(taskId, toColumnId, orderedTaskIds);
    },
  },
});
