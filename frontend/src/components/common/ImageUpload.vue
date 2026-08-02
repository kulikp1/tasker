<script setup lang="ts">
import { ref } from 'vue';
import { ImagePlus, X, Loader2 } from 'lucide-vue-next';
import { uploadImage } from '@/api/uploads';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';

const props = defineProps<{ modelValue?: string | null; folder: 'avatars' | 'tasks' | 'shopping'; label?: string; round?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [string | null] }>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

async function onFileChange(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const url = await uploadImage(file, props.folder);
    emit('update:modelValue', url);
    toast.success('Зображення завантажено');
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося завантажити зображення'));
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

function remove(): void {
  emit('update:modelValue', null);
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{{ label }}</label>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    <div v-if="modelValue" class="relative inline-block">
      <img :src="modelValue" alt="" class="object-cover" :class="round ? 'h-20 w-20 rounded-full' : 'h-28 w-28 rounded-xl'" />
      <button type="button" class="touch-target absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow" @click="remove">
        <X :size="14" />
      </button>
    </div>
    <button
      v-else
      type="button"
      class="touch-target flex items-center justify-center border border-dashed border-slate-300 dark:border-white/15 text-slate-400 transition-colors hover:border-accent-400 hover:text-accent-500"
      :class="round ? 'h-20 w-20 rounded-full' : 'h-28 w-28 rounded-xl'"
      :disabled="uploading"
      @click="fileInput?.click()"
    >
      <Loader2 v-if="uploading" :size="22" class="animate-spin" />
      <ImagePlus v-else :size="22" />
    </button>
  </div>
</template>
