<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Trash2, Loader2 } from 'lucide-vue-next';
import Modal from '@/components/common/Modal.vue';
import DatePicker from '@/components/common/DatePicker.vue';
import TimePicker from '@/components/common/TimePicker.vue';
import ImageUpload from '@/components/common/ImageUpload.vue';
import Avatar from '@/components/common/Avatar.vue';
import { useAuthStore } from '@/stores/auth';
import { usePeopleStore } from '@/stores/people';
import { useBoardStore } from '@/stores/board';
import { useConfirm } from '@/composables/useConfirm';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import { TAG_COLORS } from '@/lib/tagColors';
import type { Task } from '@/api/types';

const props = defineProps<{ modelValue: boolean; task?: Task | null; defaultColumnId?: string }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const auth = useAuthStore();
const people = usePeopleStore();
const board = useBoardStore();
const { confirm } = useConfirm();

const title = ref('');
const description = ref('');
const assigneeId = ref<string>('');
const deadlineDate = ref<string | null>(null);
const deadlineTime = ref<string | null>(null);
const imageUrl = ref<string | null>(null);
const tag = ref('');
const tagColor = ref<string>('purple');
const saving = ref(false);
const deleting = ref(false);

function resetFromTask(): void {
  title.value = props.task?.title ?? '';
  description.value = props.task?.description ?? '';
  assigneeId.value = props.task?.assigneeId ?? '';
  deadlineDate.value = props.task?.deadlineDate ?? null;
  deadlineTime.value = props.task?.deadlineTime ?? null;
  imageUrl.value = props.task?.imageUrl ?? null;
  tag.value = props.task?.tag ?? '';
  tagColor.value = props.task?.tagColor ?? 'purple';
}

watch(() => [props.modelValue, props.task], () => {
  if (props.modelValue) resetFromTask();
}, { immediate: true });

const isNew = computed(() => !props.task);
const isCreator = computed(() => isNew.value || props.task?.createdBy === auth.user?.id);
const readOnly = computed(() => !isCreator.value);
const creatorUser = computed(() => people.byId(props.task?.createdBy));
const assigneeUser = computed(() => people.byId(props.task?.assigneeId));

async function save(): Promise<void> {
  if (!title.value.trim()) {
    toast.error('Вкажіть назву таски');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      assigneeId: assigneeId.value || null,
      deadlineDate: deadlineDate.value,
      deadlineTime: deadlineTime.value,
      imageUrl: imageUrl.value,
      tag: tag.value.trim() || null,
      tagColor: tag.value.trim() ? tagColor.value : null,
    };
    if (isNew.value) {
      await board.createTask({ ...payload, columnId: props.defaultColumnId! });
      toast.success('Таску створено');
    } else {
      await board.editTask(props.task!._id, payload);
      toast.success('Таску оновлено');
    }
    emit('update:modelValue', false);
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося зберегти таску'));
  } finally {
    saving.value = false;
  }
}

async function remove(): Promise<void> {
  if (!props.task) return;
  const ok = await confirm({ title: 'Видалити таску?', message: `«${props.task.title}» буде видалено назавжди.`, danger: true, confirmText: 'Видалити' });
  if (!ok) return;
  deleting.value = true;
  try {
    await board.removeTask(props.task._id);
    toast.success('Таску видалено');
    emit('update:modelValue', false);
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося видалити таску'));
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <Modal :model-value="modelValue" :title="isNew ? 'Нова таска' : 'Таска'" size="md" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="flex flex-col gap-5">
      <div v-if="readOnly" class="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        Редагувати може лише автор таски. Ви можете переміщувати цю таску між колонками.
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Назва</label>
        <input v-model="title" type="text" :disabled="readOnly" placeholder="Що потрібно зробити?" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 disabled:opacity-60" />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Тег</label>
        <div class="flex items-center gap-2">
          <input v-model="tag" type="text" :disabled="readOnly" maxlength="40" placeholder="напр. дизайн" class="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 disabled:opacity-60" />
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              v-for="c in TAG_COLORS"
              :key="c.key"
              type="button"
              :disabled="readOnly"
              class="h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-white transition-all disabled:opacity-40 dark:ring-offset-[#15151d]"
              :class="tagColor === c.key ? 'ring-slate-400 dark:ring-white/60' : 'ring-transparent'"
              :style="{ backgroundColor: c.hex }"
              :title="c.label"
              @click="tagColor = c.key"
            />
          </div>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Опис</label>
        <textarea v-model="description" :disabled="readOnly" rows="3" placeholder="Деталі (необовʼязково)" class="w-full resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 disabled:opacity-60" />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Виконавець</label>
        <select v-model="assigneeId" :disabled="readOnly" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 disabled:opacity-60">
          <option value="">Без виконавця</option>
          <option v-for="u in people.users" :key="u.id" :value="u.id">{{ u.username }}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <DatePicker v-model="deadlineDate" label="Дедлайн (дата)" />
        <TimePicker v-model="deadlineTime" label="Дедлайн (час)" />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Зображення</label>
        <ImageUpload v-model="imageUrl" folder="tasks" />
      </div>

      <div v-if="!isNew && (creatorUser || assigneeUser)" class="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-white/[0.06]">
        <span v-if="creatorUser" class="flex items-center gap-1.5">
          Автор:
          <Avatar :src="creatorUser.avatarUrl" :name="creatorUser.username" :size="20" />
          <span class="font-medium text-slate-600 dark:text-slate-300">{{ creatorUser.username }}</span>
        </span>
        <span v-if="assigneeUser" class="flex items-center gap-1.5">
          Виконавець:
          <Avatar :src="assigneeUser.avatarUrl" :name="assigneeUser.username" :size="20" />
          <span class="font-medium text-slate-600 dark:text-slate-300">{{ assigneeUser.username }}</span>
        </span>
      </div>
    </div>

    <template #footer>
      <button v-if="!isNew && isCreator" type="button" class="touch-target mr-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50" :disabled="deleting" @click="remove">
        <Trash2 :size="16" /> Видалити
      </button>
      <button v-if="!readOnly" type="button" class="touch-target rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50" :disabled="saving" @click="save">
        <Loader2 v-if="saving" :size="16" class="mr-1.5 inline animate-spin" />
        Зберегти
      </button>
    </template>
  </Modal>
</template>
