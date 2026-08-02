import { defineStore } from 'pinia';
import * as authApi from '@/api/auth';
import * as usersApi from '@/api/users';
import type { PublicUser } from '@/api/types';
import { apiErrorMessage } from '@/api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as PublicUser | null,
    initialized: false,
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async init(): Promise<void> {
      try {
        const { data } = await authApi.fetchMe();
        this.user = data.user;
      } catch {
        this.user = null;
      } finally {
        this.initialized = true;
      }
    },
    async loginWithGoogle(credential: string): Promise<void> {
      const { data } = await authApi.loginWithGoogle(credential);
      this.user = data.user;
    },
    async logout(): Promise<void> {
      try {
        await authApi.logout();
      } finally {
        this.user = null;
      }
    },
    async updateProfile(payload: { username?: string; avatarUrl?: string }): Promise<void> {
      const { data } = await usersApi.updateMe(payload);
      this.user = data.user;
    },
    handleExpired(): void {
      this.user = null;
    },
  },
});

export { apiErrorMessage };
