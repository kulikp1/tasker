import { defineStore } from 'pinia';
import Pusher, { type Channel } from 'pusher-js';

type Listener = () => void;

const boardListeners = new Set<Listener>();
const shoppingListeners = new Set<Listener>();
const notificationListeners = new Set<(payload: unknown) => void>();

export function getSocketId(): string | undefined {
  return pusher?.connection.socket_id;
}

let pusher: Pusher | null = null;
let boardChannel: Channel | null = null;
let shoppingChannel: Channel | null = null;
let notificationsChannel: Channel | null = null;
let presenceChannel: Channel | null = null;

export const useRealtimeStore = defineStore('realtime', {
  state: () => ({
    connected: false,
    onlineUserIds: [] as string[],
  }),
  actions: {
    connect(userId: string, workspaceId: string): void {
      if (pusher) return;
      const key = import.meta.env.VITE_PUSHER_KEY as string;
      const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string;
      if (!key || !cluster) {
        console.warn('Pusher не налаштований (VITE_PUSHER_KEY/VITE_PUSHER_CLUSTER відсутні) - realtime вимкнено');
        return;
      }
      pusher = new Pusher(key, {
        cluster,
        channelAuthorization: {
          endpoint: `${(import.meta.env.VITE_API_BASE_URL as string) || '/api'}/realtime/auth`,
          transport: 'ajax',
        },
      });
      pusher.connection.bind('connected', () => {
        this.connected = true;
      });
      pusher.connection.bind('disconnected', () => {
        this.connected = false;
      });

      boardChannel = pusher.subscribe(`private-board-${workspaceId}`);
      boardChannel.bind('board:updated', () => boardListeners.forEach((cb) => cb()));

      shoppingChannel = pusher.subscribe(`private-shopping-${workspaceId}`);
      shoppingChannel.bind('shopping:updated', () => shoppingListeners.forEach((cb) => cb()));

      notificationsChannel = pusher.subscribe(`private-notifications-${userId}`);
      notificationsChannel.bind('notification:created', (payload: unknown) =>
        notificationListeners.forEach((cb) => cb(payload))
      );

      presenceChannel = pusher.subscribe(`presence-online-${workspaceId}`);
      presenceChannel.bind('pusher:subscription_succeeded', (members: { each: (cb: (m: { id: string }) => void) => void }) => {
        const ids: string[] = [];
        members.each((m) => ids.push(m.id));
        this.onlineUserIds = ids;
      });
      presenceChannel.bind('pusher:member_added', (member: { id: string }) => {
        if (!this.onlineUserIds.includes(member.id)) this.onlineUserIds.push(member.id);
      });
      presenceChannel.bind('pusher:member_removed', (member: { id: string }) => {
        this.onlineUserIds = this.onlineUserIds.filter((id) => id !== member.id);
      });
    },
    disconnect(): void {
      pusher?.disconnect();
      pusher = null;
      boardChannel = null;
      shoppingChannel = null;
      notificationsChannel = null;
      presenceChannel = null;
      this.connected = false;
      this.onlineUserIds = [];
    },
    onBoardUpdated(cb: Listener): () => void {
      boardListeners.add(cb);
      return () => boardListeners.delete(cb);
    },
    onShoppingUpdated(cb: Listener): () => void {
      shoppingListeners.add(cb);
      return () => shoppingListeners.delete(cb);
    },
    onNotificationCreated(cb: (payload: unknown) => void): () => void {
      notificationListeners.add(cb);
      return () => notificationListeners.delete(cb);
    },
  },
});
