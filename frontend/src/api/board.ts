import { api } from './client';
import type { Column, Task } from './types';

export function fetchBoard() {
  return api.get<{ columns: Column[]; tasks: Task[] }>('/board');
}

export function createColumn(title: string, isTerminal = false) {
  return api.post<{ column: Column }>('/board/columns', { title, isTerminal });
}

export function updateColumn(id: string, data: Partial<Pick<Column, 'title' | 'isTerminal'>>) {
  return api.patch<{ column: Column }>(`/board/columns/${id}`, data);
}

export function deleteColumn(id: string) {
  return api.delete(`/board/columns/${id}`);
}

export function reorderColumns(orderedIds: string[]) {
  return api.patch('/board/columns-reorder', { orderedIds });
}

export interface TaskInput {
  title: string;
  description?: string;
  columnId: string;
  assigneeId?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  imageUrl?: string | null;
  tag?: string | null;
  tagColor?: string | null;
}

export function createTask(data: TaskInput) {
  return api.post<{ task: Task }>('/board/tasks', data);
}

export function updateTask(id: string, data: Partial<TaskInput>) {
  return api.patch<{ task: Task }>(`/board/tasks/${id}`, data);
}

export function deleteTask(id: string) {
  return api.delete(`/board/tasks/${id}`);
}

export function moveTask(taskId: string, toColumnId: string, orderedTaskIds: string[]) {
  return api.patch('/board/tasks/move', { taskId, toColumnId, orderedTaskIds });
}
