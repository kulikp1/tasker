<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, Plus, Archive, ArchiveRestore, Trash2, X } from 'lucide-vue-next';
import { noteColor } from '@/lib/noteColors';
import { usePeopleStore } from '@/stores/people';
import Spinner from '@/components/common/Spinner.vue';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import type { ShoppingList } from '@/api/types';

const props = defineProps<{ list: ShoppingList; index: number; archived?: boolean; addItem?: (title: string) => Promise<void> }>();
const emit = defineEmits<{
  toggleItem: [itemId: string, value: boolean];
  removeItem: [itemId: string];
  archive: [];
  unarchive: [];
  remove: [];
}>();

const people = usePeopleStore();
const newItem = ref('');

const c = computed(() => noteColor(props.list.color));
const purchased = computed(() => props.list.items.filter((i) => i.isPurchased).length);
const total = computed(() => props.list.items.length);
const progress = computed(() => (total.value === 0 ? 0 : Math.round((purchased.value / total.value) * 100)));
const author = computed(() => people.byId(props.list.createdBy)?.username ?? '—');
// Deterministic tilt per note so the board looks pinned, never re-rolled on render.
const tilt = computed(() => {
  let h = 0;
  for (const ch of props.list._id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  const step = (h % 5) - 2;
  return (step === 0 ? 2 : step) * 1.4;
});

function createdLabel(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const submitting = ref(false);

async function submitItem(): Promise<void> {
  const t = newItem.value.trim();
  if (!t || submitting.value) return;
  if (!props.addItem) return;
  submitting.value = true;
  try {
    await props.addItem(t);
    // Only clear once the server actually confirmed it - otherwise a failed request looked
    // like the item silently vanished, since the input was already emptied either way.
    newItem.value = '';
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося додати покупку'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="group relative rounded-[14px] px-5 pb-5 pt-6 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:z-10 hover:!rotate-0"
    :style="{ backgroundColor: c.paper, color: c.ink, transform: `rotate(${tilt}deg)`, borderTop: `1px solid ${c.paperEdge}` }"
  >
    <!-- tape -->
    <span class="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-2 rounded-[3px] bg-white/40 shadow-sm backdrop-blur-sm" />

    <div class="absolute right-2 top-2 flex items-center gap-1">
      <button v-if="!archived" type="button" class="touch-target flex h-7 w-7 items-center justify-center rounded-full bg-black/5 hover:bg-black/15" title="В архів" @click="emit('archive')"><Archive :size="14" /></button>
      <button v-else type="button" class="touch-target flex h-7 w-7 items-center justify-center rounded-full bg-black/5 hover:bg-black/15" title="Повернути" @click="emit('unarchive')"><ArchiveRestore :size="14" /></button>
      <button type="button" class="touch-target flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-red-600/80 hover:bg-red-500/20" title="Видалити" @click="emit('remove')"><Trash2 :size="14" /></button>
    </div>

    <div class="flex items-center justify-end pr-20 font-mono text-[11px] opacity-60">
      <span class="text-right">{{ createdLabel(list.createdAt) }}</span>
    </div>

    <div class="mt-1 flex items-end justify-between gap-2">
      <h3 class="font-display text-3xl font-bold leading-none">{{ list.title }}</h3>
      <span class="shrink-0 font-mono text-xs opacity-70">{{ purchased }} / {{ total }}</span>
    </div>

    <div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10">
      <div class="h-full rounded-full bg-emerald-500/70 transition-all duration-500" :style="{ width: `${progress}%` }" />
    </div>

    <ul class="mt-3 flex flex-col">
      <li
        v-for="item in list.items"
        :key="item._id"
        class="group/item flex items-center gap-2.5 border-b border-dashed py-2"
        :style="{ borderColor: c.line }"
      >
        <button
          type="button"
          class="touch-target flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          :class="item.isPurchased ? 'border-emerald-500 bg-emerald-500 text-white' : ''"
          :style="item.isPurchased ? {} : { borderColor: c.line }"
          @click="emit('toggleItem', item._id, !item.isPurchased)"
        >
          <Check v-if="item.isPurchased" :size="12" :stroke-width="3" />
        </button>
        <span class="min-w-0 flex-1 truncate font-display text-xl leading-tight" :class="item.isPurchased ? 'line-through opacity-45' : ''">{{ item.title }}</span>
        <span v-if="item.quantity" class="shrink-0 font-mono text-[11px] opacity-55">×{{ item.quantity }}</span>
        <button type="button" class="touch-target shrink-0 opacity-0 transition-opacity hover:text-red-600 group-hover/item:opacity-60" @click="emit('removeItem', item._id)"><X :size="14" /></button>
      </li>

      <li v-if="!archived" class="flex items-center gap-2.5 py-2">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-dashed" :style="{ borderColor: c.line }" />
        <input
          v-model="newItem"
          type="text"
          placeholder="ще покупка…"
          :disabled="submitting"
          class="min-w-0 flex-1 bg-transparent font-display text-xl leading-tight placeholder:opacity-40 focus:outline-none disabled:opacity-50"
          :style="{ color: c.ink }"
          @keyup.enter="submitItem"
        />
        <button type="button" class="touch-target flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 disabled:opacity-50" :disabled="submitting" @click="submitItem">
          <Spinner v-if="submitting" :size="14" />
          <Plus v-else :size="15" />
        </button>
      </li>
    </ul>

    <p class="mt-3 font-mono text-[10px] uppercase tracking-wider opacity-45">Автор · {{ author }}</p>
  </div>
</template>
