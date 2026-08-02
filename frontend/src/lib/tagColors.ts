export interface TagColor {
  key: string;
  hex: string;
  label: string;
}

export const TAG_COLORS: TagColor[] = [
  { key: 'purple', hex: '#8b5cf6', label: 'Фіолетовий' },
  { key: 'blue', hex: '#3b82f6', label: 'Синій' },
  { key: 'amber', hex: '#f59e0b', label: 'Бурштиновий' },
  { key: 'green', hex: '#22c55e', label: 'Зелений' },
  { key: 'pink', hex: '#ec4899', label: 'Рожевий' },
  { key: 'cyan', hex: '#06b6d4', label: 'Бірюзовий' },
  { key: 'red', hex: '#ef4444', label: 'Червоний' },
];

const MAP: Record<string, string> = Object.fromEntries(TAG_COLORS.map((c) => [c.key, c.hex]));

export function tagHex(key?: string): string {
  return (key && MAP[key]) || '#8b5cf6';
}
