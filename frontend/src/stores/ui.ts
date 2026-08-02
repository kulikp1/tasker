import { defineStore } from 'pinia';

type Theme = 'dark' | 'light';

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: (localStorage.getItem('tasker-theme') as Theme) || 'dark',
  }),
  actions: {
    init(): void {
      applyTheme(this.theme);
    },
    toggleTheme(): void {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tasker-theme', this.theme);
      applyTheme(this.theme);
    },
  },
});
