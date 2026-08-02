<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { UserPlus } from 'lucide-vue-next';
import Avatar from '@/components/common/Avatar.vue';
import CreateUserModal from '@/components/admin/CreateUserModal.vue';
import { useAdminStore } from '@/stores/admin';
import { useRealtimeStore } from '@/stores/realtime';
import { useAuthStore } from '@/stores/auth';

const admin = useAdminStore();
const realtime = useRealtimeStore();
const auth = useAuthStore();
const createOpen = ref(false);
const logFilter = ref('');

onMounted(async () => {
  await Promise.all([admin.fetchUsers(), admin.fetchLogs()]);
});

async function onFilterChange(): Promise<void> {
  await admin.fetchLogs(logFilter.value || undefined);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const ACTION_LABELS: Record<string, string> = {
  create_task: 'створив(ла) таску',
  update_task: 'оновив(ла) таску',
  delete_task: 'видалив(ла) таску',
  move_task: 'перемістив(ла) таску',
  create_column: 'створив(ла) колонку',
  update_column: 'оновив(ла) колонку',
  delete_column: 'видалив(ла) колонку',
  update_profile: 'оновив(ла) профіль',
  create_user: 'запросив(ла) юзера',
  login: 'увійшов(ла)',
  connect_bank: 'підключив(ла) Monobank',
  sync_bank: 'синхронізував(ла) фінанси',
  create_shopping_item: 'додав(ла) покупку',
  update_shopping_item: 'оновив(ла) покупку',
  delete_shopping_item: 'видалив(ла) покупку',
  archive_shopping_item: 'заархівував(ла) покупку',
  unarchive_shopping_item: 'розархівував(ла) покупку',
  purchase_shopping_item: 'відмітив(ла) куплено',
  unpurchase_shopping_item: 'скасував(ла) позначку куплено',
};
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <h1 class="mb-5 font-display text-5xl font-bold leading-none text-slate-900 dark:text-white">Адмін-панель</h1>

    <section class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400">Юзери</h2>
        <button type="button" class="touch-target flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-2 text-xs font-medium text-white hover:bg-accent-600" @click="createOpen = true">
          <UserPlus :size="14" /> Новий юзер
        </button>
      </div>
      <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="u in admin.users" :key="u._id" class="glass flex items-center gap-3 rounded-2xl p-3.5">
          <Avatar :src="u.avatarUrl" :name="u.username" :size="40" :online="realtime.onlineUserIds.includes(u._id)" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ u.username }} <span class="text-xs text-slate-400">· {{ u.role }}</span></p>
            <p class="truncate text-xs text-slate-400">{{ u.email }}</p>
            <p class="text-xs text-slate-400">
              {{ realtime.onlineUserIds.includes(u._id) ? 'Онлайн' : u.lastActivityAt ? `Був(ла) ${formatDate(u.lastActivityAt)}` : 'Ще не заходив(ла)' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400">Журнал дій ({{ admin.logsTotal }})</h2>
        <select v-model="logFilter" class="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1.5 text-xs outline-none focus:border-accent-400" @change="onFilterChange">
          <option value="">Усі (крім мене)</option>
          <option v-for="u in admin.users" :key="u._id" :value="u._id">{{ u.username }}</option>
        </select>
      </div>
      <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <ul v-if="admin.logs.length > 0" class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <li v-for="log in admin.logs" :key="log._id" class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
            <span class="font-medium text-slate-800 dark:text-slate-100">{{ log.username }}</span>
            <span class="text-slate-500 dark:text-slate-400">{{ ACTION_LABELS[log.action] ?? log.action }}</span>
            <span class="ml-auto shrink-0 text-xs text-slate-400">{{ formatDate(log.createdAt) }}</span>
          </li>
        </ul>
        <p v-else class="py-8 text-center text-sm text-slate-400">Немає записів</p>
      </div>
    </section>

    <CreateUserModal v-model="createOpen" />
  </div>
</template>
