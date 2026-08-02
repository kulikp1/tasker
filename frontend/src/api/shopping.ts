import { api } from './client';
import type { ShoppingList } from './types';

export function fetchShoppingLists(archived: boolean) {
  return api.get<{ lists: ShoppingList[] }>('/shopping', { params: { archived } });
}

export function createShoppingList(title: string, color: string) {
  return api.post<{ list: ShoppingList }>('/shopping', { title, color });
}

export function updateShoppingList(id: string, data: { title?: string; color?: string }) {
  return api.patch<{ list: ShoppingList }>(`/shopping/${id}`, data);
}

export function setListArchived(id: string, isArchived: boolean) {
  return api.patch<{ list: ShoppingList }>(`/shopping/${id}/archive`, { isArchived });
}

export function deleteShoppingList(id: string) {
  return api.delete(`/shopping/${id}`);
}

export function addListItem(listId: string, title: string, quantity?: string | null) {
  return api.post<{ list: ShoppingList }>(`/shopping/${listId}/items`, { title, quantity });
}

export function updateListItem(listId: string, itemId: string, data: { title?: string; quantity?: string | null; isPurchased?: boolean }) {
  return api.patch<{ list: ShoppingList }>(`/shopping/${listId}/items/${itemId}`, data);
}

export function deleteListItem(listId: string, itemId: string) {
  return api.delete<{ list: ShoppingList }>(`/shopping/${listId}/items/${itemId}`);
}
