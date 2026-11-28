import { displayToKg } from '@/lib/fitness';

import { canApply, formatLast, formatSuggestion, overloadHint, weightStep, type PastSet, type Progression } from './overload';

const range: Progression = { repsMin: 8, repsMax: 10, equipment: 'barbell' };
const sets = (kg: number | null, ...reps: number[]): PastSet[] => reps.map((r) => ({ weightKg: kg, reps: r }));

describe('overloadHint (weight and reps)', () => {
  it('adds weight once every set reaches the top of the range, restarting at the bottom', () => {
    const hint = overloadHint('weight_reps', range, [sets(80, 10, 10, 10)], 'kg');
    expect(hint?.suggestion).toEqual({ kind: 'increase', weightKg: 82.5, reps: 8 });
  });

  it('uses 2 kg steps for dumbbells and 5 lb steps in pounds', () => {
    expect(overloadHint('weight_reps', { ...range, equipment: 'dumbbell' }, [sets(22, 10, 10)], 'kg')?.suggestion).toMatchObject({ weightKg: 24 });
    const lb = overloadHint('weight_reps', range, [sets(displayToKg(135, 'lb'), 10, 10)], 'lb')!.suggestion;
    expect(lb.kind === 'increase' && formatSuggestion(lb, 'lb')).toBe('try 140 lb × 8');
  });

  it('always moves up a full step, even from an off-step weight', () => {
    expect(overloadHint('weight_reps', { ...range, equipment: 'dumbbell' }, [sets(22.5, 10, 10)], 'kg')?.suggestion).toMatchObject({ weightKg: 24 });
    expect(overloadHint('weight_reps', range, [sets(81, 10, 10)], 'kg')?.suggestion).toMatchObject({ weightKg: 82.5 });
  });

  it('keeps the weight and asks for one more rep while inside the range', () => {
    expect(overloadHint('weight_reps', range, [sets(80, 10, 9, 8)], 'kg')?.suggestion).toEqual({ kind: 'reps', weightKg: 80, reps: 9 });
  });

  it('judges the session by its heaviest sets and ignores lighter back-off sets', () => {
    const last = [...sets(100, 10, 10), ...sets(80, 6)];
    expect(overloadHint('weight_reps', range, [last], 'kg')?.suggestion).toMatchObject({ kind: 'increase', weightKg: 102.5 });
  });

  it('treats a fixed rep target (5x5) as a range of one', () => {
    expect(overloadHint('weight_reps', { repsMin: 5, repsMax: 5, equipment: 'barbell' }, [sets(100, 5, 5, 5, 5, 5)], 'kg')?.suggestion).toEqual({
      kind: 'increase',
      weightKg: 102.5,
      reps: 5,
    });
  });

  it('holds the weight after one or two misses below the range', () => {
    const two = [sets(80, 7, 6), sets(80, 7, 7), sets(77.5, 10, 10)];
    expect(overloadHint('weight_reps', range, two, 'kg')?.suggestion).toEqual({ kind: 'reps', weightKg: 80, reps: 8 });
  });

  it('suggests about 10% lighter after three misses in a row at the same weight', () => {
    const three = [sets(80, 7, 6), sets(80, 7, 7), sets(80, 6, 6)];
    expect(overloadHint('weight_reps', range, three, 'kg')?.suggestion).toEqual({ kind: 'deload', weightKg: 72.5, reps: 8, misses: 3 });
  });

  it("doesn't count misses at a different weight toward a deload", () => {
    const mixed = [sets(80, 7, 6), sets(80, 7, 7), sets(82.5, 6, 6)];
    expect(overloadHint('weight_reps', range, mixed, 'kg')?.suggestion.kind).toBe('reps');
  });

  it('returns nothing without history, for timed exercises, or for incomplete sets', () => {
    expect(overloadHint('weight_reps', range, [], 'kg')).toBeNull();
    expect(overloadHint('duration', range, [sets(null, 30)], 'kg')).toBeNull();
    expect(overloadHint('weight_reps', range, [sets(null, 10)], 'kg')).toBeNull();
  });
});

describe('overloadHint (reps only)', () => {
  it('asks for one more rep inside the range and the bottom after a miss', () => {
    expect(overloadHint('reps_only', range, [sets(null, 9, 8)], 'kg')?.suggestion).toEqual({ kind: 'reps', weightKg: null, reps: 9 });
    expect(overloadHint('reps_only', range, [sets(null, 6, 5)], 'kg')?.suggestion).toEqual({ kind: 'reps', weightKg: null, reps: 8 });
  });

  it('points to a harder variation at the top of the range, with nothing to apply', () => {
    const s = overloadHint('reps_only', range, [sets(null, 10, 12)], 'kg')!.suggestion;
    expect(s.kind).toBe('harder');
    expect(canApply(s)).toBe(false);
  });
});

describe('formatting', () => {
  it('describes last time compactly', () => {
    expect(formatLast('weight_reps', sets(80, 10, 10, 9), 'kg')).toBe('80 kg × 10, 10, 9');
    expect(formatLast('weight_reps', [...sets(80, 8), ...sets(72.5, 10)], 'kg')).toBe('80×8, 72.5×10');
    expect(formatLast('reps_only', sets(null, 12, 10), 'kg')).toBe('12, 10 reps');
  });

  it('phrases each suggestion', () => {
    expect(formatSuggestion({ kind: 'reps', weightKg: 80, reps: 9 }, 'kg')).toBe('stay at 80 kg, aim for 9 reps');
    expect(formatSuggestion({ kind: 'deload', weightKg: 72.5, reps: 8, misses: 3 }, 'kg')).toBe('3 sessions short: try 72.5 kg and build back up');
  });

  it('picks the step by equipment and unit', () => {
    expect(weightStep('kettlebell', 'kg')).toBe(2);
    expect(weightStep('machine', 'kg')).toBe(2.5);
    expect(weightStep('dumbbell', 'lb')).toBe(5);
  });
});
