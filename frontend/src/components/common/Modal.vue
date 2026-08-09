<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  persistent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  elevated?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

function close(): void {
  if (props.persistent) return;
  emit('update:modelValue', false);
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close();
}

// Plain `overflow: hidden` on <html> leaves the page scrolled where it was, so on iOS a
// `position: fixed` modal opened mid-scroll renders offset by that scroll distance (looks
// like it "jumps" to the wrong spot). Freezing <body> in place with a negative top instead
// keeps the fixed modal correctly aligned to the viewport, then restores the scroll on close.
// The restore is deferred to the backdrop's @after-leave (not done here immediately) - unlocking
// right away, while the 150ms fade-out is still playing, snaps the page behind it back into
// place mid-animation, which reads as the close being laggy/janky.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      lockScroll();
      window.addEventListener('keydown', onKeydown);
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  }
);

onUnmounted(() => {
  if (props.modelValue) unlockScroll();
});

const sizeClass = {
  sm: 'max-w-sm lg:max-w-md',
  md: 'max-w-lg lg:max-w-2xl',
  lg: 'max-w-2xl lg:max-w-4xl',
};
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0" @after-leave="unlockScroll">
      <div v-if="modelValue" class="fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-900/40 px-2 py-4 backdrop-blur-sm safe-x sm:p-6" :class="elevated ? 'z-[60]' : 'z-50'" @mousedown.self="close">
        <Transition appear enter-active-class="animate-pop-in">
          <div
            class="my-auto flex max-h-[calc(100svh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#15151d]"
            :class="sizeClass[size ?? 'md']"
            @mousedown.stop
          >
            <div v-if="title || $slots.title" class="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-white/[0.06] sm:px-6">
              <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                <slot name="title">{{ title }}</slot>
              </h2>
              <button v-if="!persistent" class="touch-target -mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" @click="close">
                <X :size="18" />
              </button>
            </div>
            <div class="overflow-y-auto px-4 py-5 sm:px-6">
              <slot />
            </div>
            <div v-if="$slots.footer" class="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-6">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
