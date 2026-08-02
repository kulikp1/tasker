<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LogOut, UserPlus, Copy } from 'lucide-vue-next';
import Modal from '@/components/common/Modal.vue';
import ImageUpload from '@/components/common/ImageUpload.vue';
import Spinner from '@/components/common/Spinner.vue';
import { useAuthStore } from '@/stores/auth';
import { inviteUser } from '@/api/users';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';
import type { UserRole } from '@/api/types';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const auth = useAuthStore();
const router = useRouter();
const username = ref(auth.user?.username ?? '');
const avatarUrl = ref<string | null>(auth.user?.avatarUrl ?? null);
const savingProfile = ref(false);

const inviteEmail = ref('');
const inviteRole = ref<UserRole>('user');
const inviting = ref(false);
const invitedEmail = ref('');

async function saveProfile(): Promise<void> {
  savingProfile.value = true;
  try {
    await auth.updateProfile({ username: username.value, avatarUrl: avatarUrl.value ?? undefined });
    toast.success('Профіль оновлено');
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося оновити профіль'));
  } finally {
    savingProfile.value = false;
  }
}

function inviteMessage(): string {
  return `Тебе запросили в Tasker: ${window.location.origin}\nЗайди туди і увійди через Google з поштою ${invitedEmail.value}.`;
}

async function sendInvite(): Promise<void> {
  if (!inviteEmail.value.trim()) return;
  inviting.value = true;
  try {
    const { data } = await inviteUser(inviteEmail.value.trim().toLowerCase(), inviteRole.value);
    invitedEmail.value = data.user.email;
    toast.success('Запрошення створено');
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося запросити'));
  } finally {
    inviting.value = false;
  }
}

function copyInvite(): void {
  navigator.clipboard.writeText(inviteMessage());
  toast.success('Скопійовано');
}

function resetInvite(): void {
  inviteEmail.value = '';
  inviteRole.value = 'user';
  invitedEmail.value = '';
}

async function onLogout(): Promise<void> {
  await auth.logout();
  emit('update:modelValue', false);
  await router.push({ name: 'login' });
  toast.info('Ви вийшли з акаунту');
}
</script>

<template>
  <Modal :model-value="modelValue" title="Профіль" size="sm" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="flex flex-col gap-6">
      <section class="flex flex-col items-center gap-3">
        <ImageUpload v-model="avatarUrl" folder="avatars" round />
        <div class="w-full">
          <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Юзернейм</label>
          <input v-model="username" type="text" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400" />
        </div>
        <div class="w-full">
          <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Пошта (Google)</label>
          <p class="w-full rounded-xl border border-slate-200 bg-black/[0.03] px-3.5 py-2.5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{{ auth.user?.email }}</p>
        </div>
        <button type="button" class="touch-target flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-500 py-2.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50" :disabled="savingProfile" @click="saveProfile">
          <Spinner v-if="savingProfile" :size="16" />
          Зберегти профіль
        </button>
      </section>

      <section class="border-t border-slate-200 dark:border-white/10 pt-5">
        <h3 class="mb-3 text-sm font-semibold">Запросити людину у своє середовище</h3>
        <div v-if="!invitedEmail" class="flex flex-col gap-2.5">
          <input v-model="inviteEmail" type="email" placeholder="Пошта (Google-акаунт)" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400" @keyup.enter="sendInvite" />
          <select v-if="auth.isAdmin" v-model="inviteRole" class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button type="button" class="touch-target flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 dark:bg-white/10 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" :disabled="inviting" @click="sendInvite">
            <Spinner v-if="inviting" :size="16" />
            <UserPlus v-else :size="16" /> Запросити
          </button>
        </div>
        <div v-else class="flex flex-col gap-2.5">
          <p class="text-sm text-slate-500 dark:text-slate-400">Готово. Немає авто-розсилки — надішли це запрошення сам(а) будь-яким каналом.</p>
          <div class="rounded-xl bg-black/[0.03] dark:bg-white/5 p-3 text-sm whitespace-pre-line">{{ inviteMessage() }}</div>
          <div class="flex gap-2">
            <button type="button" class="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 dark:bg-white/10 py-2.5 text-sm font-medium text-white hover:opacity-90" @click="copyInvite">
              <Copy :size="16" /> Скопіювати
            </button>
            <button type="button" class="touch-target rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-black/5 dark:hover:bg-white/10" @click="resetInvite">Ще одна</button>
          </div>
        </div>
      </section>

      <button type="button" class="touch-target flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 sm:hidden" @click="onLogout">
        <LogOut :size="16" /> Вийти з акаунту
      </button>
    </div>
  </Modal>
</template>
