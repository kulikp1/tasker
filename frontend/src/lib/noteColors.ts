export interface NoteColor {
  key: string;
  label: string;
  paper: string;
  paperEdge: string;
  ink: string;
  line: string;
}

// Paper stays light in both themes - light notes pinned to a dark board is the whole aesthetic.
export const NOTE_COLORS: NoteColor[] = [
  { key: 'cream', label: 'Крем', paper: '#f5ecc7', paperEdge: '#ecdfa8', ink: '#4a4226', line: '#d9cc8f' },
  { key: 'mint', label: 'Мʼята', paper: '#dcebd2', paperEdge: '#c7dcb8', ink: '#33452e', line: '#bcd3ab' },
  { key: 'sky', label: 'Небо', paper: '#d8e7f3', paperEdge: '#bfd6ea', ink: '#2b4054', line: '#b3cbe0' },
  { key: 'rose', label: 'Троянда', paper: '#f4dbe4', paperEdge: '#e8c2d0', ink: '#513042', line: '#e0b6c6' },
  { key: 'lilac', label: 'Бузок', paper: '#e6def6', paperEdge: '#d3c7ee', ink: '#3c3357', line: '#ccbfe8' },
];

const MAP: Record<string, NoteColor> = Object.fromEntries(NOTE_COLORS.map((c) => [c.key, c]));

export function noteColor(key?: string): NoteColor {
  return (key && MAP[key]) || NOTE_COLORS[0];
}
