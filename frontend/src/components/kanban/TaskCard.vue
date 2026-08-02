<script setup lang="ts">
import { computed } from 'vue';
import { Square, ArrowRight } from 'lucide-vue-next';
import Avatar from '@/components/common/Avatar.vue';
import { usePeopleStore } from '@/stores/people';
import { useRealtimeStore } from '@/stores/realtime';
import { tagHex } from '@/lib/tagColors';
import type { Task } from '@/api/types';

const props = defineProps<{ task: Task }>();
defineEmits<{ click: [] }>();

const people = usePeopleStore();
const realtime = useRealtimeStore();

const creator = computed(() => people.byId(props.task.createdBy));
const assignee = computed(() => people.byId(props.task.assigneeId));
const accent = computed(() => tagHex(props.task.tagColor));
const deadlineLabel = computed(() => {
  if (!props.task.deadlineDate) return null;
  const d = new Date(props.task.deadlineDate);
  const date = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  return props.task.deadlineTime ? `${date}, ${props.task.deadlineTime}` : date;
});
</script>

<template>
  <div
    class="group relative cursor-grab overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing dark:border-white/10 dark:bg-white/[0.05]"
    @click="$emit('click')"
  >
    <span v-if="task.tag" class="absolute inset-y-0 left-0 w-1" :style="{ backgroundColor: accent }" />

    <div class="p-4 pl-5">
      <div v-if="task.imageUrl" v-viewer class="mb-3" @click.stop>
        <img :src="task.imageUrl" alt="" class="h-28 w-full cursor-zoom-in rounded-xl object-cover" />
      </div>

      <span
        v-if="task.tag"
        class="mb-2.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
        :style="{ backgroundColor: accent + '22', color: accent }"
      >{{ task.tag }}</span>

      <p class="text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">{{ task.title }}</p>
      <p v-if="task.description" class="mt-1 line-clamp-2 text-sm text-slate-400">{{ task.description }}</p>

      <div class="mt-3 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
        <div v-if="deadlineLabel" class="flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <Square :size="13" /> {{ deadlineLabel }}
        </div>
        <div class="mt-2 flex items-center justify-between">
          <div v-if="assignee" class="flex items-center gap-1.5" :title="`${creator?.username ?? '?'} → ${assignee.username}`">
            <Avatar :src="creator?.avatarUrl" :name="creator?.username ?? '?'" :size="22" :online="creator ? realtime.onlineUserIds.includes(creator.id) : undefined" />
            <ArrowRight :size="13" class="shrink-0 text-slate-300 dark:text-slate-600" />
            <Avatar :src="assignee.avatarUrl" :name="assignee.username" :size="22" :online="realtime.onlineUserIds.includes(assignee.id)" />
            <span class="ml-1 text-xs text-slate-400">{{ creator?.username }} → {{ assignee.username }}</span>
          </div>
          <div v-else-if="creator" class="flex items-center gap-1.5">
            <Avatar :src="creator.avatarUrl" :name="creator.username" :size="22" :online="realtime.onlineUserIds.includes(creator.id)" />
            <span class="text-xs text-slate-400">{{ creator.username }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
