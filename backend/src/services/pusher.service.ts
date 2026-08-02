import Pusher from 'pusher';
import { env } from '../config/env';

export const pusher = new Pusher({
  appId: env.pusher.appId,
  key: env.pusher.key,
  secret: env.pusher.secret,
  cluster: env.pusher.cluster,
  useTLS: true,
});

export const CHANNELS = {
  board: (workspaceId: string) => `private-board-${workspaceId}`,
  shopping: (workspaceId: string) => `private-shopping-${workspaceId}`,
  notifications: (userId: string) => `private-notifications-${userId}`,
  presence: (workspaceId: string) => `presence-online-${workspaceId}`,
};

export const EVENTS = {
  boardUpdated: 'board:updated',
  notificationCreated: 'notification:created',
  shoppingUpdated: 'shopping:updated',
};

export function triggerSafe(channel: string, event: string, data: unknown, excludeSocketId?: string): void {
  pusher.trigger(channel, event, data, excludeSocketId ? { socket_id: excludeSocketId } : undefined).catch((err) => {
    console.error('Pusher trigger failed', channel, event, err);
  });
}
