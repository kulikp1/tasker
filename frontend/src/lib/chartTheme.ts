export const CATEGORICAL_LIGHT = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948'];
export const CATEGORICAL_DARK = ['#3987e5', '#008300', '#d55181', '#c98500', '#199e70', '#d95926', '#9085e9', '#e66767'];

export const STATUS = {
  good: { light: '#0ca30c', dark: '#0ca30c' },
  critical: { light: '#d03b3b', dark: '#e66767' },
};

export const INK = {
  secondary: { light: '#52514e', dark: '#c3c2b7' },
  muted: { light: '#898781', dark: '#898781' },
  grid: { light: '#e1e0d9', dark: '#2c2c2a' },
};

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

export function categoricalPalette(): string[] {
  return isDarkMode() ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

export function statusColor(role: 'good' | 'critical'): string {
  return isDarkMode() ? STATUS[role].dark : STATUS[role].light;
}

export function inkColor(role: 'secondary' | 'muted' | 'grid'): string {
  return isDarkMode() ? INK[role].dark : INK[role].light;
}

const MAX_SLICES = 8;

export function foldToTop(items: Array<{ category: string; amount: number }>, otherLabel = 'Інше'): Array<{ category: string; amount: number }> {
  if (items.length <= MAX_SLICES) return items;
  const top = items.slice(0, MAX_SLICES - 1);
  const restSum = items.slice(MAX_SLICES - 1).reduce((sum, i) => sum + i.amount, 0);
  return [...top, { category: otherLabel, amount: Math.round(restSum * 100) / 100 }];
}

export const baseFont = { family: 'Inter, system-ui, sans-serif', size: 12 };
