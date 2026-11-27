// Short, original motivational lines, grouped by where they appear. No attributions: these are Gymly's own.
// The first line of each list is the one shown on day zero; keep lists short so they stay fresh but familiar.

export type QuoteContext = 'landing' | 'sign-in' | 'sign-up' | 'train' | 'history' | 'progress' | 'programs' | 'workout-complete';

export const quotes: Record<QuoteContext, readonly string[]> = {
  landing: [
    'Small steps. Stronger every day.',
    'Show up. Log it. Get better.',
    'Strength is built one set at a time.',
  ],
  'sign-in': [
    'Discipline today. Strength tomorrow.',
    'Welcome back. Let’s pick up where you left off.',
    'Consistency beats intensity.',
  ],
  'sign-up': [
    'Every champion starts somewhere.',
    'Day one starts now.',
    'Your first rep is the hardest. Make it today.',
  ],
  train: [
    'You don’t have to be perfect. Just show up.',
    'One good session at a time.',
    'Warm up, lock in, lift.',
    'Today’s effort is tomorrow’s strength.',
  ],
  history: [
    'Every workout is a promise kept.',
    'Look how far you’ve come.',
    'Each session adds up.',
  ],
  progress: [
    'Progress, not perfection.',
    'Slow progress is still progress.',
    'Stronger than last month. That’s the goal.',
  ],
  programs: [
    'Trust the process.',
    'Plan the work. Work the plan.',
    'Consistency compounds.',
  ],
  'workout-complete': [
    'Another workout. Another win.',
    'Done. Rest up and come back stronger.',
    'That’s one more in the bank.',
  ],
};

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 in local time, so the quote changes at the user's midnight, not UTC's. */
function localDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** The quote for a context on a given day: stable all day, rotates daily. */
export function quoteOfTheDay(context: QuoteContext, date: Date): string {
  const list = quotes[context];
  return list[localDayNumber(date) % list.length];
}
