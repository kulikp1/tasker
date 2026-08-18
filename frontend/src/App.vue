<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Toaster } from 'vue-sonner';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useRealtimeStore } from '@/stores/realtime';
import { useNotificationsStore } from '@/stores/notifications';
import { useShoppingStore } from '@/stores/shopping';
import Header from '@/components/layout/Header.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { toast } from '@/lib/toast';
import type { AppNotification } from '@/api/types';

const auth = useAuthStore();
const ui = useUiStore();
const realtime = useRealtimeStore();
const notifications = useNotificationsStore();
const shopping = useShoppingStore();
const route = useRoute();

ui.init();

window.addEventListener('auth:expired', () => {
  auth.handleExpired();
});

onMounted(async () => {
  if (!auth.initialized) await auth.init();
});

watch(
  () => auth.user?.id,
  async (userId, prevUserId) => {
    if (userId && userId !== prevUserId) {
      realtime.connect(userId, auth.user!.workspaceId);
      await notifications.fetch();
      shopping.fetchActive().catch(() => undefined);
      realtime.onShoppingUpdated(() => shopping.fetchActive().catch(() => undefined));
      realtime.onNotificationCreated((payload) => {
        const n = payload as AppNotification;
        notifications.addLive(n);
        toast.info(n.type === 'task_completed' ? `${n.payload.fromUsername} завершив(ла) «${n.payload.taskTitle}»` : `${n.payload.fromUsername} призначив(ла) вам «${n.payload.taskTitle}»`);
      });
    } else if (!userId) {
      realtime.disconnect();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="app-shell flex flex-col overflow-hidden">
    <Header v-if="auth.isAuthenticated && route.name !== 'login'" />
    <main class="min-h-0 flex-1 overflow-y-auto pb-6">
      <RouterView />
    </main>
    <BottomNav v-if="auth.isAuthenticated && route.name !== 'login'" />
    <ConfirmDialog />
    <Toaster
      position="bottom-right"
      rich-colors
      :theme="ui.theme"
      offset="24px"
      :toast-options="{ style: { fontFamily: 'Inter, sans-serif' } }"
    />
  </div>
</template>
