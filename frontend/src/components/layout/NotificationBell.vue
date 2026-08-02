<script setup lang="ts">
import { computed, ref } from 'vue';
import { Bell, CheckCheck, PartyPopper, UserPlus2 } from 'lucide-vue-next';
import Modal from '@/components/common/Modal.vue';
import { useNotificationsStore } from '@/stores/notifications';

const store = useNotificationsStore();
const open = ref(false);

const sorted = computed(() => [...store.items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

async function onOpen(): Promise<void> {
  open.value = true;
  await store.fetch();
}

async function onClickItem(id: string | undefined): Promise<void> {
  if (!id) return;
  await store.markRead(id);
}
</script>

<template>
  <button type="button" class="touch-target relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" @click="onOpen">
    <Bell :size="18" />
    <span
      v-if="store.unreadCount > 0"
      class="absolute -right-1 -top-1 flex h-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-surface-dark"
    >
      {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
    </span>
  </button>

  <Modal v-model="open" title="Сповіщення" size="md">
    <div v-if="sorted.length === 0" class="py-8 text-center text-sm text-slate-400">Немає сповіщень</div>
    <div v-else class="flex flex-col gap-1.5 -mx-2">
      <button
        v-for="n in sorted"
        :key="n._id ?? n.id"
        type="button"
        class="touch-target flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
        :class="n.isRead ? 'opacity-60' : 'bg-accent-50 dark:bg-white/5'"
        @click="onClickItem(n._id ?? n.id)"
      >
        <span class="mt-0.5 rounded-full bg-accent-100 dark:bg-white/10 p-1.5 text-accent-600 dark:text-accent-300">
          <PartyPopper v-if="n.type === 'task_completed'" :size="16" />
          <UserPlus2 v-else :size="16" />
        </span>
        <span class="flex-1">
          <span class="block text-sm">
            <template v-if="n.type === 'task_assigned'">
              <b>{{ n.payload.fromUsername }}</b> призначив(ла) вам таску «{{ n.payload.taskTitle }}»
            </template>
            <template v-else>
              <b>{{ n.payload.fromUsername }}</b> завершив(ла) таску «{{ n.payload.taskTitle }}»
            </template>
          </span>
          <span class="block text-xs text-slate-400 mt-0.5">{{ formatDate(n.createdAt) }}</span>
        </span>
      </button>
    </div>
    <template v-if="sorted.length > 0" #footer>
      <button type="button" class="touch-target flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10" @click="store.markAllRead()">
        <CheckCheck :size="16" /> Прочитати всі
      </button>
    </template>
  </Modal>
</template>
