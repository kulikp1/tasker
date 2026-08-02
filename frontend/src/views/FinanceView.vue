<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RefreshCw, Link2, Loader2 } from 'lucide-vue-next';
import StatCard from '@/components/finance/StatCard.vue';
import CategoryDonutChart from '@/components/finance/CategoryDonutChart.vue';
import TrendChart from '@/components/finance/TrendChart.vue';
import MonthComparisonChart from '@/components/finance/MonthComparisonChart.vue';
import TopCategoriesBar from '@/components/finance/TopCategoriesBar.vue';
import TransactionsList from '@/components/finance/TransactionsList.vue';
import ConnectMonobankModal from '@/components/finance/ConnectMonobankModal.vue';
import { useFinanceStore } from '@/stores/finance';
import { toast } from '@/lib/toast';
import { apiErrorMessage } from '@/api/client';

const finance = useFinanceStore();
const connectOpen = ref(false);
const syncing = ref(false);
const loaded = ref(false);

async function loadAll(): Promise<void> {
  await Promise.all([finance.fetchStats(), finance.fetchTransactions(1)]);
}

onMounted(async () => {
  await finance.fetchAccounts();
  if (finance.accounts.length > 0) await loadAll();
  loaded.value = true;
});

async function onSync(): Promise<void> {
  syncing.value = true;
  try {
    const count = await finance.sync();
    toast.success(`Синхронізовано ${count} транзакцій`);
    await loadAll();
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Не вдалося синхронізувати'));
  } finally {
    syncing.value = false;
  }
}

async function selectAccount(accountId: string): Promise<void> {
  finance.selectedAccountId = accountId;
  await loadAll();
}

const lastSyncLabel = computed(() => (finance.lastSyncedAt ? new Date(finance.lastSyncedAt).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'ще не синхронізовано'));
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-5xl font-bold leading-none text-slate-900 dark:text-white">Фінанси</h1>
      <div class="flex items-center gap-2">
        <button v-if="finance.accounts.length > 0" type="button" class="touch-target flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50" :disabled="syncing" @click="onSync">
          <Loader2 v-if="syncing" :size="14" class="animate-spin" />
          <RefreshCw v-else :size="14" />
          Синхронізувати
        </button>
        <button type="button" class="touch-target flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-2 text-xs font-medium text-white hover:bg-accent-600" @click="connectOpen = true">
          <Link2 :size="14" /> {{ finance.accounts.length > 0 ? 'Перепідключити' : 'Підключити Monobank' }}
        </button>
      </div>
    </div>

    <div v-if="!loaded" class="py-16 text-center text-sm text-slate-400">Завантаження…</div>

    <div v-else-if="finance.accounts.length === 0" class="glass rounded-2xl p-10 text-center">
      <p class="mb-3 text-sm text-slate-500 dark:text-slate-400">Підключіть Monobank, щоб побачити свою фінансову аналітику.</p>
      <button type="button" class="touch-target inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600" @click="connectOpen = true">
        <Link2 :size="16" /> Підключити Monobank
      </button>
    </div>

    <template v-else>
      <div class="mb-4 flex items-center gap-2 overflow-x-auto">
        <button
          v-for="acc in finance.accounts"
          :key="acc.accountId"
          type="button"
          class="touch-target shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors"
          :class="finance.selectedAccountId === acc.accountId ? 'bg-accent-500 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-300'"
          @click="selectAccount(acc.accountId)"
        >
          {{ acc.maskedPan }} · {{ acc.balance.toLocaleString('uk-UA') }} ₴
        </button>
        <span class="ml-auto shrink-0 text-xs text-slate-400">Синхронізовано: {{ lastSyncLabel }}</span>
      </div>

      <div v-if="finance.stats" class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Витрачено за період" :value="`${finance.stats.summary.totalSpent.toLocaleString('uk-UA')} ₴`" tone="critical" />
        <StatCard label="Надійшло за період" :value="`${finance.stats.summary.totalIncome.toLocaleString('uk-UA')} ₴`" tone="good" />
        <StatCard label="Транзакцій" :value="String(finance.stats.summary.transactionCount)" />
        <StatCard label="Середній чек" :value="`${finance.stats.summary.avgTransaction.toLocaleString('uk-UA')} ₴`" />
      </div>

      <div v-if="finance.stats" class="grid gap-4 lg:grid-cols-2">
        <div class="glass rounded-2xl p-4">
          <h2 class="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Витрати по категоріях</h2>
          <CategoryDonutChart :items="finance.stats.totalsByCategory" />
        </div>
        <div class="glass rounded-2xl p-4">
          <h2 class="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Динаміка витрат і надходжень</h2>
          <TrendChart :items="finance.stats.trend" />
        </div>
        <div class="glass rounded-2xl p-4">
          <h2 class="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Місяць до місяця</h2>
          <MonthComparisonChart :items="finance.stats.monthComparison" />
        </div>
        <div class="glass rounded-2xl p-4">
          <h2 class="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Топ-5 категорій витрат</h2>
          <TopCategoriesBar :items="finance.stats.top5Categories" />
        </div>
      </div>

      <div class="mt-5">
        <h2 class="mb-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400">Транзакції</h2>
        <TransactionsList />
      </div>
    </template>

    <ConnectMonobankModal v-model="connectOpen" />
  </div>
</template>
