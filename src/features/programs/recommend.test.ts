import { availableDayCounts, defaultDayCount, recommendedProgramId, type Level } from './recommend';

const p = (id: string, days: number, level: Level) => ({ id, days_per_week: days, level });

describe('availableDayCounts', () => {
  it('lists distinct counts in order', () => {
    expect(availableDayCounts([p('a', 5, 'beginner'), p('b', 3, 'beginner'), p('c', 5, 'advanced'), p('d', 4, 'beginner')])).toEqual([3, 4, 5]);
  });
});

describe('defaultDayCount', () => {
  const avail = [3, 4, 5, 6];
  it("uses the onboarding choice when it's available", () => {
    expect(defaultDayCount(4, avail)).toBe(4);
  });
  it('falls back to the nearest count', () => {
    expect(defaultDayCount(2, avail)).toBe(3);
    expect(defaultDayCount(7, avail)).toBe(6);
  });
  it('breaks ties toward fewer days', () => {
    expect(defaultDayCount(4, [3, 5])).toBe(3);
  });
  it('handles missing input', () => {
    expect(defaultDayCount(null, avail)).toBe(3);
    expect(defaultDayCount(4, [])).toBeNull();
  });
});

describe('recommendedProgramId', () => {
  const threeDay = [p('found', 3, 'beginner'), p('home', 3, 'beginner'), p('strength', 3, 'intermediate')];
  it('prefers an exact level match (first one wins)', () => {
    expect(recommendedProgramId(threeDay, 'beginner')).toBe('found');
    expect(recommendedProgramId(threeDay, 'intermediate')).toBe('strength');
  });
  it('falls back to the nearest level', () => {
    expect(recommendedProgramId(threeDay, 'advanced')).toBe('strength');
    expect(recommendedProgramId([p('ppl', 6, 'advanced')], 'beginner')).toBe('ppl');
  });
  it('treats an unknown experience as beginner, and returns null with no programs', () => {
    expect(recommendedProgramId(threeDay, null)).toBe('found');
    expect(recommendedProgramId([], 'beginner')).toBeNull();
  });
});
