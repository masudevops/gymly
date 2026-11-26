// Calendar helpers for stats. Dates are handled as local "YYYY-MM-DD" strings, matching what the
// database returns when it groups by day in the user's timezone. Weeks start on Monday.

export const userTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** Local calendar date as YYYY-MM-DD. */
export function toDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses YYYY-MM-DD as a local date (not UTC, which would shift the day west of Greenwich). */
export function fromDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Monday of the week containing `d`, at local midnight. */
export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(r, -dow);
}

/** The 7 days (YYYY-MM-DD) of the week containing `d`, Monday first. */
export function weekDays(d: Date): string[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => toDay(addDays(start, i)));
}

/**
 * Consecutive weeks (Mon–Sun) with at least one workout, counting back from now.
 * The current week only extends the streak once you've trained in it, but an empty
 * current week doesn't break it yet (you still have days left).
 */
export function weeklyStreak(trainedDays: string[], now = new Date()): number {
  const weeks = new Set(trainedDays.map((s) => toDay(startOfWeek(fromDay(s)))));
  let cursor = startOfWeek(now);
  let streak = 0;
  if (!weeks.has(toDay(cursor))) cursor = addDays(cursor, -7);
  while (weeks.has(toDay(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/** Grid of the last `weeks` weeks (oldest first), each an array of 7 YYYY-MM-DD days. */
export function calendarWeeks(weeks: number, now = new Date()): string[][] {
  const thisWeek = startOfWeek(now);
  return Array.from({ length: weeks }, (_, i) => weekDays(addDays(thisWeek, -7 * (weeks - 1 - i))));
}

export function shortDate(s: string): string {
  return fromDay(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
