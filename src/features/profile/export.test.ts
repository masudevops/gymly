import { workoutsToCsv, type ExportWorkout } from './export';

const workout: ExportWorkout = {
  name: 'Push, "heavy"',
  started_at: '2026-11-20T18:00:00+00:00',
  finished_at: '2026-11-20T19:00:00+00:00',
  workout_exercises: [
    { position: 1, exercise: { name: 'Plank' }, workout_sets: [{ position: 0, weight_kg: null, reps: null, duration_seconds: 60, rpe: null, is_warmup: false }] },
    {
      position: 0,
      exercise: { name: 'Bench Press' },
      workout_sets: [
        { position: 1, weight_kg: 100, reps: 5, duration_seconds: null, rpe: 8.5, is_warmup: false },
        { position: 0, weight_kg: 60, reps: 10, duration_seconds: null, rpe: null, is_warmup: true },
      ],
    },
  ],
};

describe('workoutsToCsv', () => {
  it('writes one row per set in exercise and set order, escaping text', () => {
    expect(workoutsToCsv([workout], 'kg').trim().split('\n')).toEqual([
      'date,workout,exercise,set,warmup,weight_kg,reps,duration_seconds,rpe',
      '2026-11-20T18:00:00+00:00,"Push, ""heavy""",Bench Press,1,yes,60,10,,',
      '2026-11-20T18:00:00+00:00,"Push, ""heavy""",Bench Press,2,no,100,5,,8.5',
      '2026-11-20T18:00:00+00:00,"Push, ""heavy""",Plank,1,no,,,60,',
    ]);
  });

  it('converts weights to pounds', () => {
    const lines = workoutsToCsv([workout], 'lb').split('\n');
    expect(lines[0]).toContain('weight_lb');
    expect(lines[2]).toContain(',220.46,');
  });

  it('returns just the header with no workouts', () => {
    expect(workoutsToCsv([], 'kg')).toBe('date,workout,exercise,set,warmup,weight_kg,reps,duration_seconds,rpe\n');
  });
});
