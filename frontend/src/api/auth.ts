import { api } from './client';
import type { PublicUser } from './types';

export function loginWithGoogle(credential: string) {
  return api.post<{ user: PublicUser }>('/auth/google', { credential });
}

export function logout() {
  return api.post('/auth/logout');
}

export function fetchMe() {
  return api.get<{ user: PublicUser }>('/auth/me');
}
