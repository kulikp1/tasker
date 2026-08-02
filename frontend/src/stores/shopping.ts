import { defineStore } from 'pinia';
import * as api from '@/api/shopping';
import type { ShoppingList } from '@/api/types';

// Keeps existing stickers at their current grid position and only prepends genuinely
// new ones, so a background resync never reshuffles cards the user is looking at.
function mergeLists(current: ShoppingList[], incoming: ShoppingList[]): ShoppingList[] {
  const incomingById = new Map(incoming.map((l) => [l._id, l]));
  const kept = current.filter((l) => incomingById.has(l._id)).map((l) => incomingById.get(l._id)!);
  const keptIds = new Set(kept.map((l) => l._id));
  const fresh = incoming.filter((l) => !keptIds.has(l._id));
  return [...fresh, ...kept];
}

export const useShoppingStore = defineStore('shopping', {
  state: () => ({
    activeLists: [] as ShoppingList[],
    archivedLists: [] as ShoppingList[],
    loaded: false,
  }),
  actions: {
    async fetchActive(): Promise<void> {
      const { data } = await api.fetchShoppingLists(false);
      this.activeLists = this.loaded ? mergeLists(this.activeLists, data.lists) : data.lists;
      this.loaded = true;
    },
    async fetchArchived(): Promise<void> {
      const { data } = await api.fetchShoppingLists(true);
      this.archivedLists = mergeLists(this.archivedLists, data.lists);
    },
    replaceList(list: ShoppingList): void {
      // A mutation may auto-archive the list, moving it between arrays entirely; otherwise
      // update it in place so its grid position never jumps on an item toggle.
      const wasActive = this.activeLists.findIndex((l) => l._id === list._id);
      const wasArchived = this.archivedLists.findIndex((l) => l._id === list._id);
      if (list.isArchived) {
        if (wasActive !== -1) this.activeLists.splice(wasActive, 1);
        if (wasArchived !== -1) this.archivedLists.splice(wasArchived, 1, list);
        else this.archivedLists.unshift(list);
      } else {
        if (wasArchived !== -1) this.archivedLists.splice(wasArchived, 1);
        if (wasActive !== -1) this.activeLists.splice(wasActive, 1, list);
        else this.activeLists.unshift(list);
      }
    },
    async createList(title: string, color: string): Promise<void> {
      const { data } = await api.createShoppingList(title, color);
      // Routed through replaceList (not a raw unshift) so a concurrent realtime resync
      // racing this response can never leave the same list inserted twice.
      this.replaceList(data.list);
    },
    async renameList(id: string, title: string, color: string): Promise<void> {
      const { data } = await api.updateShoppingList(id, { title, color });
      this.replaceList(data.list);
    },
    async archiveList(id: string): Promise<void> {
      const { data } = await api.setListArchived(id, true);
      this.replaceList(data.list);
    },
    async unarchiveList(id: string): Promise<void> {
      const { data } = await api.setListArchived(id, false);
      this.replaceList(data.list);
    },
    async removeList(id: string): Promise<void> {
      await api.deleteShoppingList(id);
      this.activeLists = this.activeLists.filter((l) => l._id !== id);
      this.archivedLists = this.archivedLists.filter((l) => l._id !== id);
    },
    async addItem(listId: string, title: string, quantity?: string | null): Promise<void> {
      const { data } = await api.addListItem(listId, title, quantity);
      this.replaceList(data.list);
    },
    async toggleItem(listId: string, itemId: string, isPurchased: boolean): Promise<void> {
      const { data } = await api.updateListItem(listId, itemId, { isPurchased });
      this.replaceList(data.list);
    },
    async editItem(listId: string, itemId: string, data: { title?: string; quantity?: string | null }): Promise<void> {
      const res = await api.updateListItem(listId, itemId, data);
      this.replaceList(res.data.list);
    },
    async removeItem(listId: string, itemId: string): Promise<void> {
      const { data } = await api.deleteListItem(listId, itemId);
      this.replaceList(data.list);
    },
  },
});
