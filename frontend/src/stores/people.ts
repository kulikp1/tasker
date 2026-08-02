import { defineStore } from 'pinia';
import { fetchAllUsers, type PersonSummary } from '@/api/users';

export const usePeopleStore = defineStore('people', {
  state: () => ({
    users: [] as PersonSummary[],
    loaded: false,
  }),
  getters: {
    byId: (state) => (id?: string | null) => state.users.find((u) => u.id === id),
  },
  actions: {
    async fetch(): Promise<void> {
      const { data } = await fetchAllUsers();
      this.users = data.users;
      this.loaded = true;
    },
  },
});
