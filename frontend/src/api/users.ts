import { api } from './client';
import type { PublicUser, UserRole } from './types';

export interface PersonSummary {
  id: string;
  username: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
}

export function updateMe(data: { username?: string; avatarUrl?: string }) {
  return api.patch<{ user: PublicUser }>('/users/me', data);
}

export function fetchAllUsers() {
  return api.get<{ users: PersonSummary[] }>('/users');
}

export function inviteUser(email: string, role: UserRole) {
  return api.post<{ user: { id: string; username: string; email: string; role: UserRole } }>('/users/invite', { email, role });
}
