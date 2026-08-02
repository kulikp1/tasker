import { api } from './client';
import type { AppNotification } from './types';

export function fetchNotifications() {
  return api.get<{ notifications: AppNotification[]; unreadCount: number }>('/notifications');
}

export function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch('/notifications/read-all');
}
