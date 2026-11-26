// Pure helpers for the Programs tab's "days per week" picker. Unit-tested in recommend.test.ts.

export type Level = 'beginner' | 'intermediate' | 'advanced';

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Distinct days-per-week values that have programs, ascending. */
export function availableDayCounts(programs: { days_per_week: number }[]): number[] {
  return [...new Set(programs.map((p) => p.days_per_week))].sort((a, b) => a - b);
}

/**
 * The day count to preselect: the user's onboarding choice if programs exist for it,
 * otherwise the closest available count (ties go to fewer days, the easier commitment).
 */
export function defaultDayCount(trainingDays: number | null | undefined, available: number[]): number | null {
  if (available.length === 0) return null;
  if (!trainingDays) return available[0];
  return available.reduce((best, d) => {
    const diff = Math.abs(d - trainingDays);
    const bestDiff = Math.abs(best - trainingDays);
    return diff < bestDiff || (diff === bestDiff && d < best) ? d : best;
  });
}

/**
 * The program to badge "Recommended" for this experience level: an exact level match first,
 * otherwise the nearest level (ties go to the easier program). Null when there are no programs.
 */
export function recommendedProgramId<T extends { id: string; level: Level }>(programs: T[], experience: Level | null | undefined): string | null {
  if (programs.length === 0) return null;
  const target = LEVEL_RANK[experience ?? 'beginner'];
  let best = programs[0];
  for (const p of programs) {
    const d = Math.abs(LEVEL_RANK[p.level] - target);
    const bd = Math.abs(LEVEL_RANK[best.level] - target);
    if (d < bd || (d === bd && LEVEL_RANK[p.level] < LEVEL_RANK[best.level])) best = p;
  }
  return best.id;
}
