<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useFinanceStore } from '@/stores/finance';
import { CATEGORY_OPTIONS } from '@/lib/categories';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';

const finance = useFinanceStore();

const totalPages = computed(() => Math.max(1, Math.ceil(finance.transactionsTotal / 20)));

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

async function goToPage(page: number): Promise<void> {
  if (page < 1 || page > totalPages.value) return;
  await finance.fetchTransactions(page);
}

async function onCategoryChange(id: string, category: string): Promise<void> {
  try {
    await finance.setCategory(id, category);
    toast.success('Категорію оновлено');
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-1.5">
      <div v-for="tx in finance.transactions" :key="tx.id" class="glass flex items-center gap-3 rounded-xl px-3.5 py-2.5">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ tx.description }}</p>
          <p class="text-xs text-slate-400">{{ formatDate(tx.time) }}</p>
        </div>
        <select
          :value="tx.category"
          class="hidden shrink-0 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-2 py-1 text-xs outline-none sm:block"
          @change="onCategoryChange(tx.id, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in CATEGORY_OPTIONS" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="shrink-0 text-sm font-semibold tabular-nums" :class="tx.amount < 0 ? 'text-rose-500' : 'text-emerald-500'">
          {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString('uk-UA') }} ₴
        </span>
      </div>
      <p v-if="finance.transactions.length === 0" class="py-10 text-center text-sm text-slate-400">Транзакцій не знайдено</p>
    </div>

    <div v-if="finance.transactions.length > 0" class="mt-3 flex items-center justify-center gap-3">
      <button class="touch-target rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30" :disabled="finance.page <= 1" @click="goToPage(finance.page - 1)">
        <ChevronLeft :size="16" />
      </button>
      <span class="text-xs text-slate-400">{{ finance.page }} / {{ totalPages }}</span>
      <button class="touch-target rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30" :disabled="finance.page >= totalPages" @click="goToPage(finance.page + 1)">
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>
