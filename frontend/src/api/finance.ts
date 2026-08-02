import { api } from './client';
import type { BankAccount, FinanceStats, FinanceTransaction } from './types';

export function connectMonobank(token: string) {
  return api.post<{ accounts: BankAccount[] }>('/finance/monobank/connect', { token });
}

export function fetchAccounts() {
  return api.get<{ accounts: BankAccount[]; lastSyncedAt: string | null }>('/finance/monobank/accounts');
}

export function syncMonobank() {
  return api.post<{ ok: boolean; synced: number }>('/finance/monobank/sync');
}

export function fetchTransactions(params: { page?: number; limit?: number; accountId?: string; category?: string; from?: string; to?: string }) {
  return api.get<{ transactions: FinanceTransaction[]; total: number; page: number; limit: number }>('/finance/transactions', { params });
}

export function updateTransactionCategory(id: string, category: string) {
  return api.patch<{ transaction: FinanceTransaction }>(`/finance/transactions/${id}/category`, { category });
}

export function fetchStats(params: { accountId?: string; days?: number }) {
  return api.get<FinanceStats>('/finance/stats', { params });
}
