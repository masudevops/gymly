// Training math shared by logging, stats and programs. Weights are stored in kg; convert at the edges.

export type Unit = 'kg' | 'lb';

const LB_PER_KG = 2.2046226218;

export function kgToDisplay(kg: number, unit: Unit): number {
  return unit === 'kg' ? kg : kg * LB_PER_KG;
}

export function displayToKg(value: number, unit: Unit): number {
  return unit === 'kg' ? value : value / LB_PER_KG;
}

/** Rounds to the nearest plate-friendly increment (2.5 kg or 5 lb by default). */
export function roundToIncrement(value: number, unit: Unit, increment = unit === 'kg' ? 2.5 : 5): number {
  return Math.round(value / increment) * increment;
}

/**
 * Estimated one-rep max using the Epley formula: weight * (1 + reps / 30).
 * A single rep returns the weight itself. Above 12 reps the estimate gets unreliable, so it returns null.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (!(weight > 0) || !Number.isInteger(reps) || reps < 1 || reps > 12) return null;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Total volume (weight x reps) for a list of completed sets. Warm-up sets are excluded. */
export function totalVolume(sets: { weight: number; reps: number; isWarmup?: boolean }[]): number {
  return sets.reduce((sum, s) => (s.isWarmup ? sum : sum + Math.max(0, s.weight) * Math.max(0, s.reps)), 0);
}
