// Progressive overload hints for program sessions: double progression within the program's rep range,
// plus a conservative deload after repeated misses. Pure and framework-free; the UI only ever suggests,
// the user decides (tapping a hint fills unticked sets, nothing else).
import type { Database } from '@/lib/database.types';
import { displayToKg, kgToDisplay, type Unit } from '@/lib/fitness';
import { formatWeight } from '@/lib/format';

import type { ExerciseKind } from './model';

export type Equipment = Database['public']['Enums']['equipment'];

/** What a program prescribes for an exercise; carried on program-session exercises only. */
export type Progression = { repsMin: number; repsMax: number; equipment: Equipment };

/** One completed working set from an earlier session. */
export type PastSet = { weightKg: number | null; reps: number | null };

export type Suggestion =
  | { kind: 'increase'; weightKg: number; reps: number }
  | { kind: 'reps'; weightKg: number | null; reps: number }
  | { kind: 'deload'; weightKg: number; reps: number; misses: number }
  | { kind: 'harder' };

export type Hint = { last: PastSet[]; suggestion: Suggestion };

/** Sessions at the same weight that fall short of the bottom of the range before a deload is suggested. */
export const DELOAD_AFTER_MISSES = 3;
const DELOAD_FACTOR = 0.9;

/** Smallest sensible jump in display units: fixed dumbbell/kettlebell pairs go up 2 kg, plates 2.5 kg; 5 lb either way. */
export function weightStep(equipment: Equipment, unit: Unit): number {
  if (unit === 'lb') return 5;
  return equipment === 'dumbbell' || equipment === 'kettlebell' ? 2 : 2.5;
}

const same = (a: number, b: number) => Math.abs(a - b) < 0.01;

/** Rounds a display-unit weight to the step, moving at least one step in the given direction. */
function stepFrom(currentKg: number, targetDisplay: number, step: number, unit: Unit, dir: 1 | -1): number {
  const current = kgToDisplay(currentKg, unit);
  let next = Math.round(targetDisplay / step) * step;
  if (dir === 1 && next <= current + 0.01) next += step;
  if (dir === -1 && next >= current - 0.01) next -= step;
  return displayToKg(Math.max(0, next), unit);
}

const complete = (kind: ExerciseKind, s: PastSet) => (s.reps ?? 0) > 0 && (kind !== 'weight_reps' || s.weightKg !== null);

/**
 * Suggests the next step from recent sessions (newest first, working sets only).
 * Returns null when there's nothing useful to say: timed exercises, no history, or no rep range.
 */
export function overloadHint(kind: ExerciseKind, p: Progression, sessions: PastSet[][], unit: Unit): Hint | null {
  if (kind === 'duration' || p.repsMin < 1) return null;
  const repsMax = Math.max(p.repsMin, p.repsMax);
  const last = (sessions[0] ?? []).filter((s) => complete(kind, s));
  if (last.length === 0) return null;

  if (kind === 'reps_only') {
    const low = Math.min(...last.map((s) => s.reps!));
    if (last.every((s) => s.reps! >= repsMax)) return { last, suggestion: { kind: 'harder' } };
    return { last, suggestion: { kind: 'reps', weightKg: null, reps: low >= p.repsMin ? Math.min(repsMax, low + 1) : p.repsMin } };
  }

  // Judge the session by its heaviest working sets; lighter back-off sets don't count against it.
  const topKg = Math.max(...last.map((s) => s.weightKg!));
  const top = last.filter((s) => same(s.weightKg!, topKg));
  const low = Math.min(...top.map((s) => s.reps!));
  const step = weightStep(p.equipment, unit);

  if (top.every((s) => s.reps! >= repsMax)) {
    return { last, suggestion: { kind: 'increase', weightKg: stepFrom(topKg, kgToDisplay(topKg, unit) + step, step, unit, 1), reps: p.repsMin } };
  }
  if (low >= p.repsMin) return { last, suggestion: { kind: 'reps', weightKg: topKg, reps: Math.min(repsMax, low + 1) } };

  // Missed the bottom of the range. Count consecutive misses at this same weight.
  let misses = 0;
  for (const session of sessions) {
    const sets = session.filter((s) => complete(kind, s));
    if (sets.length === 0) break;
    const kg = Math.max(...sets.map((s) => s.weightKg!));
    if (!same(kg, topKg) || sets.filter((s) => same(s.weightKg!, kg)).every((s) => s.reps! >= p.repsMin)) break;
    misses += 1;
  }
  if (misses >= DELOAD_AFTER_MISSES && topKg > 0) {
    const weightKg = stepFrom(topKg, kgToDisplay(topKg, unit) * DELOAD_FACTOR, step, unit, -1);
    return { last, suggestion: { kind: 'deload', weightKg, reps: p.repsMin, misses } };
  }
  return { last, suggestion: { kind: 'reps', weightKg: topKg, reps: p.repsMin } };
}

/** "80 kg × 10, 10, 9" when every set used one weight, otherwise "80×8, 75×10". */
export function formatLast(kind: ExerciseKind, sets: PastSet[], unit: Unit): string {
  if (kind !== 'weight_reps') return `${sets.map((s) => s.reps).join(', ')} reps`;
  const first = sets[0].weightKg!;
  if (sets.every((s) => same(s.weightKg!, first))) return `${formatWeight(first, unit)} ${unit} × ${sets.map((s) => s.reps).join(', ')}`;
  return sets.map((s) => `${formatWeight(s.weightKg, unit)}×${s.reps}`).join(', ');
}

/** The "→ …" half of the hint line. */
export function formatSuggestion(s: Suggestion, unit: Unit): string {
  switch (s.kind) {
    case 'increase':
      return `try ${formatWeight(s.weightKg, unit)} ${unit} × ${s.reps}`;
    case 'deload':
      return `${s.misses} sessions short: try ${formatWeight(s.weightKg, unit)} ${unit} and build back up`;
    case 'harder':
      return 'top of the range: add a set or try a harder variation';
    case 'reps':
      return s.weightKg === null ? `aim for ${s.reps} reps` : `stay at ${formatWeight(s.weightKg, unit)} ${unit}, aim for ${s.reps} reps`;
  }
}

/** Whether tapping the hint has numbers to fill in. */
export const canApply = (s: Suggestion): s is Exclude<Suggestion, { kind: 'harder' }> => s.kind !== 'harder';
