import { kgToDisplay, type Unit } from './fitness';

/** "100", "102.5", "225" — trims trailing zeros, max 1 decimal. */
export function formatWeight(kg: number | null | undefined, unit: Unit): string {
  if (kg === null || kg === undefined) return '';
  const v = Math.round(kgToDisplay(kg, unit) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Total volume with thousands separators, e.g. "12,450 kg". */
export function formatVolume(kg: number, unit: Unit): string {
  return `${Math.round(kgToDisplay(kg, unit)).toLocaleString('en-US')} ${unit}`;
}

/** 65 -> "1:05", 3725 -> "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

/** Workout length in words, e.g. "1h 05m" or "42m". */
export function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${String(mins % 60).padStart(2, '0')}m` : `${mins}m`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Parses user input like "102,5" or "100." into a number, or null when empty/invalid. */
export function parseNumber(text: string): number | null {
  const t = text.replace(',', '.').trim();
  if (t === '' || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "1 set", "3 sets". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
