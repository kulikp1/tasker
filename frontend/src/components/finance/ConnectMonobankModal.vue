<script setup lang="ts">
import { ref } from 'vue';
import { Loader2, Link2 } from 'lucide-vue-next';
import Modal from '@/components/common/Modal.vue';
import { useFinanceStore } from '@/stores/finance';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const finance = useFinanceStore();
const token = ref('');
const connecting = ref(false);

async function connect(): Promise<void> {
  if (!token.value.trim()) return;
  connecting.value = true;
  try {
    await finance.connect(token.value.trim());
    toast.success('Monobank підключено');
    emit('update:modelValue', false);
    token.value = '';
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося підключити Monobank'));
  } finally {
    connecting.value = false;
  }
}
</script>

<template>
  <Modal :model-value="modelValue" title="Підключити Monobank" size="sm" @update:model-value="(v) => emit('update:modelValue', v)">
    <p class="mb-3 text-sm text-slate-500 dark:text-slate-400">
      Отримайте персональний токен на
      <a href="https://api.monobank.ua/" target="_blank" rel="noopener" class="text-accent-500 underline">api.monobank.ua</a>
      і вставте його нижче. Токен зберігається у зашифрованому вигляді і використовується лише на сервері.
    </p>
    <input
      v-model="token"
      type="password"
      placeholder="Ваш Monobank токен"
      class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-accent-400"
    />
    <template #footer>
      <button type="button" class="touch-target flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50" :disabled="connecting" @click="connect">
        <Loader2 v-if="connecting" :size="16" class="animate-spin" />
        <Link2 v-else :size="16" />
        Підключити
      </button>
    </template>
  </Modal>
</template>
