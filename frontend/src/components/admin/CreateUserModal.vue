<script setup lang="ts">
import { ref } from 'vue';
import { Copy, UserPlus } from 'lucide-vue-next';
import Modal from '@/components/common/Modal.vue';
import { useAdminStore } from '@/stores/admin';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import type { UserRole } from '@/api/types';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const admin = useAdminStore();
const email = ref('');
const role = ref<UserRole>('user');
const creating = ref(false);
const invitedEmail = ref('');

const inviteMessage = () => `Тебе запросили в Tasker: ${window.location.origin}\nЗайди туди і увійди через Google з поштою ${invitedEmail.value}.`;

async function create(): Promise<void> {
  if (!email.value.trim()) return;
  creating.value = true;
  try {
    const data = await admin.createUser(email.value.trim().toLowerCase(), role.value);
    invitedEmail.value = data.user.email;
    toast.success('Юзера запрошено');
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося запросити юзера'));
  } finally {
    creating.value = false;
  }
}

function copy(): void {
  if (!invitedEmail.value) return;
  navigator.clipboard.writeText(inviteMessage());
  toast.success('Скопійовано');
}

function close(): void {
  email.value = '';
  role.value = 'user';
  invitedEmail.value = '';
  emit('update:modelValue', false);
}
</script>

<template>
  <Modal :model-value="modelValue" title="Новий юзер" size="sm" @update:model-value="close">
    <div v-if="!invitedEmail" class="flex flex-col gap-3">
      <input v-model="email" type="email" placeholder="Пошта (Google-акаунт)" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400" @keyup.enter="create" />
      <select v-model="role" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400">
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button type="button" class="touch-target flex items-center justify-center gap-1.5 rounded-xl bg-accent-500 py-2.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50" :disabled="creating" @click="create">
        <UserPlus :size="16" /> Запросити
      </button>
    </div>
    <div v-else class="flex flex-col gap-3">
      <p class="text-sm text-slate-500 dark:text-slate-400">Юзера створено. Немає авто-розсилки пошти — надішли це запрошення самостійно будь-яким зручним каналом.</p>
      <div class="rounded-xl bg-black/[0.03] dark:bg-white/5 p-3 text-sm whitespace-pre-line">{{ inviteMessage() }}</div>
      <button type="button" class="touch-target flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 dark:bg-white/10 py-2.5 text-sm font-medium text-white hover:opacity-90" @click="copy">
        <Copy :size="16" /> Скопіювати
      </button>
    </div>
  </Modal>
</template>
