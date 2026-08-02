import { defineStore } from 'pinia';
import * as api from '@/api/admin';
import { inviteUser } from '@/api/users';
import type { AdminUserRow, AuditLogRow, UserRole } from '@/api/types';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [] as AdminUserRow[],
    logs: [] as AuditLogRow[],
    logsTotal: 0,
  }),
  actions: {
    async fetchUsers(): Promise<void> {
      const { data } = await api.fetchAdminUsers();
      this.users = data.users;
    },
    async createUser(email: string, role: UserRole) {
      const { data } = await inviteUser(email, role);
      await this.fetchUsers();
      return data;
    },
    async fetchLogs(userId?: string, page = 1): Promise<void> {
      const { data } = await api.fetchAuditLogs({ userId, page, limit: 8 });
      this.logs = data.logs;
      this.logsTotal = data.total;
    },
  },
});
