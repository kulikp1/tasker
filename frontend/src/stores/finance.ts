import { defineStore } from 'pinia';
import * as api from '@/api/finance';
import type { BankAccount, FinanceStats, FinanceTransaction } from '@/api/types';

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    accounts: [] as BankAccount[],
    lastSyncedAt: null as string | null,
    selectedAccountId: '' as string,
    transactions: [] as FinanceTransaction[],
    transactionsTotal: 0,
    page: 1,
    stats: null as FinanceStats | null,
    days: 30,
  }),
  actions: {
    async connect(token: string): Promise<void> {
      const { data } = await api.connectMonobank(token);
      this.accounts = data.accounts;
      if (data.accounts[0]) this.selectedAccountId = data.accounts[0].accountId;
    },
    async fetchAccounts(): Promise<void> {
      const { data } = await api.fetchAccounts();
      this.accounts = data.accounts;
      this.lastSyncedAt = data.lastSyncedAt;
      if (!this.selectedAccountId && data.accounts[0]) this.selectedAccountId = data.accounts[0].accountId;
    },
    async sync(): Promise<number> {
      const { data } = await api.syncMonobank();
      await this.fetchAccounts();
      return data.synced;
    },
    async fetchTransactions(page = 1, category?: string): Promise<void> {
      const { data } = await api.fetchTransactions({
        page,
        limit: 20,
        accountId: this.selectedAccountId || undefined,
        category,
      });
      this.transactions = data.transactions;
      this.transactionsTotal = data.total;
      this.page = data.page;
    },
    async setCategory(id: string, category: string): Promise<void> {
      const { data } = await api.updateTransactionCategory(id, category);
      const idx = this.transactions.findIndex((t) => t.id === id);
      if (idx !== -1) this.transactions[idx] = data.transaction;
    },
    async fetchStats(): Promise<void> {
      const { data } = await api.fetchStats({ accountId: this.selectedAccountId || undefined, days: this.days });
      this.stats = data;
    },
  },
});
