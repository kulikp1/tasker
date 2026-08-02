import { api } from './client';
import type { AdminUserRow, AuditLogRow } from './types';

export function fetchAdminUsers() {
  return api.get<{ users: AdminUserRow[] }>('/admin/users');
}

export function fetchAuditLogs(params: { userId?: string; page?: number; limit?: number }) {
  return api.get<{ logs: AuditLogRow[]; total: number; page: number; limit: number }>('/admin/logs', { params });
}
