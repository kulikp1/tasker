<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import StickerNote from '@/components/shopping/StickerNote.vue';
import Spinner from '@/components/common/Spinner.vue';
import { useShoppingStore } from '@/stores/shopping';
import { useRealtimeStore } from '@/stores/realtime';
import { useConfirm } from '@/composables/useConfirm';
import { NOTE_COLORS } from '@/lib/noteColors';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';

const shopping = useShoppingStore();
const realtime = useRealtimeStore();
const { confirm } = useConfirm();

const tab = ref<'active' | 'archived'>('active');
const newTitle = ref('');
const newColor = ref(NOTE_COLORS[0].key);
const creating = ref(false);
let unsubscribe: (() => void) | null = null;

async function refresh(): Promise<void> {
  await Promise.all([shopping.fetchActive(), shopping.fetchArchived()]);
}

onMounted(async () => {
  await refresh();
  unsubscribe = realtime.onShoppingUpdated(refresh);
});
onUnmounted(() => unsubscribe?.());

async function createList(): Promise<void> {
  if (!newTitle.value.trim()) {
    toast.error('Вкажіть назву списку');
    return;
  }
  creating.value = true;
  try {
    await shopping.createList(newTitle.value.trim(), newColor.value);
    toast.success('Стікер створено');
    newTitle.value = '';
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося створити список'));
  } finally {
    creating.value = false;
  }
}

async function onToggle(listId: string, itemId: string, value: boolean): Promise<void> {
  try {
    await shopping.toggleItem(listId, itemId, value);
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
async function onAddItem(listId: string, title: string): Promise<void> {
  try {
    await shopping.addItem(listId, title);
    toast.success('Покупку додано');
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
async function onRemoveItem(listId: string, itemId: string): Promise<void> {
  try {
    await shopping.removeItem(listId, itemId);
    toast.success('Покупку видалено');
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
async function onArchive(id: string): Promise<void> {
  try {
    await shopping.archiveList(id);
    toast.success('Стікер в архіві');
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
async function onUnarchive(id: string): Promise<void> {
  try {
    await shopping.unarchiveList(id);
    toast.success('Стікер повернуто');
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
async function onRemove(id: string, title: string): Promise<void> {
  const ok = await confirm({ title: 'Видалити стікер?', message: `«${title}» буде видалено назавжди.`, danger: true, confirmText: 'Видалити' });
  if (!ok) return;
  try {
    await shopping.removeList(id);
    toast.success('Стікер видалено');
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-display text-5xl font-bold leading-none text-slate-900 dark:text-white">Список покупок</h1>

      <div class="inline-flex rounded-xl bg-slate-100/80 p-1 dark:bg-white/5">
        <button type="button" class="touch-target rounded-lg px-4 py-1.5 text-sm font-medium transition-colors" :class="tab === 'active' ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-400'" @click="tab = 'active'">Активні</button>
        <button type="button" class="touch-target rounded-lg px-4 py-1.5 text-sm font-medium transition-colors" :class="tab === 'archived' ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-400'" @click="tab = 'archived'">Архів</button>
      </div>
    </div>

    <div v-if="tab === 'active'" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StickerNote
        v-for="(list, i) in shopping.activeLists"
        :key="list._id"
        :list="list"
        :index="i"
        @toggle-item="(id, v) => onToggle(list._id, id, v)"
        @add-item="(t) => onAddItem(list._id, t)"
        @remove-item="(id) => onRemoveItem(list._id, id)"
        @archive="onArchive(list._id)"
        @remove="onRemove(list._id, list.title)"
      />

      <!-- new sticker card -->
      <div class="flex min-h-[220px] flex-col gap-4 rounded-[14px] border-2 border-dashed border-slate-300 p-6 dark:border-white/15">
        <h3 class="font-display text-3xl font-bold text-slate-500 dark:text-slate-300">Новий стікер</h3>
        <input
          v-model="newTitle"
          type="text"
          placeholder="напр. Ашан, субота"
          class="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 dark:border-white/10 dark:bg-white/5"
          @keyup.enter="createList"
        />
        <div class="flex items-center gap-2">
          <button
            v-for="col in NOTE_COLORS"
            :key="col.key"
            type="button"
            class="h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-transparent transition-all"
            :class="newColor === col.key ? 'ring-accent-500' : 'ring-transparent'"
            :style="{ backgroundColor: col.paper }"
            :title="col.label"
            @click="newColor = col.key"
          />
        </div>
        <button type="button" class="touch-target mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white shadow-glow hover:bg-accent-600 disabled:opacity-50" :disabled="creating" @click="createList">
          <Spinner v-if="creating" :size="16" />
          <Plus v-else :size="16" /> Створити список
        </button>
      </div>
    </div>

    <div v-else>
      <div v-if="shopping.archivedLists.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StickerNote
          v-for="(list, i) in shopping.archivedLists"
          :key="list._id"
          :list="list"
          :index="i"
          archived
          @unarchive="onUnarchive(list._id)"
          @remove="onRemove(list._id, list.title)"
        />
      </div>
      <p v-else class="py-16 text-center text-sm text-slate-400">Архів порожній</p>
    </div>

    <p class="mt-10 text-center font-mono text-[11px] uppercase tracking-wider text-slate-400/70">Повністю викуплені стікери переїжджають в архів</p>
  </div>
</template>
