import { calendarWeeks, fromDay, startOfWeek, toDay, weekDays, weeklyStreak } from './dates';

// Thursday, Nov 26 2026 (local time)
const NOW = new Date(2026, 10, 26, 18, 0);

describe('week helpers', () => {
  it('starts weeks on Monday', () => {
    expect(toDay(startOfWeek(NOW))).toBe('2026-11-23');
    expect(toDay(startOfWeek(new Date(2026, 10, 29)))).toBe('2026-11-23'); // Sunday belongs to the same week
    expect(toDay(startOfWeek(new Date(2026, 10, 30)))).toBe('2026-11-30'); // next Monday
  });

  it('lists the 7 days of the week', () => {
    expect(weekDays(NOW)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']);
  });

  it('round-trips local dates without timezone drift', () => {
    expect(toDay(fromDay('2026-03-08'))).toBe('2026-03-08'); // US DST change day
  });

  it('builds a calendar ending with the current week', () => {
    const grid = calendarWeeks(3, NOW);
    expect(grid).toHaveLength(3);
    expect(grid[0][0]).toBe('2026-11-09');
    expect(grid[2][6]).toBe('2026-11-29');
  });
});

describe('weeklyStreak', () => {
  it('is zero with no workouts', () => {
    expect(weeklyStreak([], NOW)).toBe(0);
  });

  it('counts consecutive weeks including the current one', () => {
    expect(weeklyStreak(['2026-11-24', '2026-11-17', '2026-11-10'], NOW)).toBe(3);
  });

  it("doesn't break the streak during a current week with no workout yet", () => {
    expect(weeklyStreak(['2026-11-20', '2026-11-12'], NOW)).toBe(2);
  });

  it('stops at the first missed week', () => {
    expect(weeklyStreak(['2026-11-25', '2026-11-18', '2026-11-04'], NOW)).toBe(2);
  });

  it('counts multiple workouts in one week once', () => {
    expect(weeklyStreak(['2026-11-23', '2026-11-25', '2026-11-26'], NOW)).toBe(1);
  });
});
