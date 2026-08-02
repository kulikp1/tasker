import { defineStore } from 'pinia';
import * as api from '@/api/notifications';
import type { AppNotification } from '@/api/types';

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as AppNotification[],
    unreadCount: 0,
  }),
  actions: {
    async fetch(): Promise<void> {
      const { data } = await api.fetchNotifications();
      this.items = data.notifications;
      this.unreadCount = data.unreadCount;
    },
    addLive(notification: AppNotification): void {
      this.items.unshift(notification);
      this.unreadCount += 1;
    },
    async markRead(id: string): Promise<void> {
      const item = this.items.find((n) => (n._id ?? n.id) === id);
      if (item && !item.isRead) {
        item.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      await api.markNotificationRead(id);
    },
    async markAllRead(): Promise<void> {
      this.items.forEach((n) => (n.isRead = true));
      this.unreadCount = 0;
      await api.markAllNotificationsRead();
    },
  },
});
