import * as M from './model';

const bench: M.ExerciseRef = { id: 'ex-bench', name: 'Barbell Bench Press', kind: 'weight_reps' };
const plank: M.ExerciseRef = { id: 'ex-plank', name: 'Plank', kind: 'duration' };
const pullup: M.ExerciseRef = { id: 'ex-pullup', name: 'Pull-Up', kind: 'reps_only' };

function fill(w: M.ActiveWorkout, exIndex: number, setIndex: number, patch: Partial<M.SetEntry>) {
  const ex = w.exercises[exIndex];
  return M.updateSet(w, ex.key, ex.sets[setIndex].key, patch);
}

describe('startWorkout', () => {
  it('names the workout by time of day and generates a UUID', () => {
    const w = M.startWorkout(new Date('2026-11-26T07:30:00'));
    expect(w.name).toBe('Morning Workout');
    expect(w.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(w.exercises).toHaveLength(0);
  });

  it('expands a template into exercises with target sets and reps', () => {
    const w = M.startWorkout(new Date(), {
      id: 'tpl-1',
      name: 'Push Day',
      exercises: [{ exercise: bench, targetSets: 3, targetRepsMin: 8, restSeconds: 120 }],
    });
    expect(w.name).toBe('Push Day');
    expect(w.templateId).toBe('tpl-1');
    expect(w.exercises[0].sets).toHaveLength(3);
    expect(w.exercises[0].sets.every((s) => s.reps === 8 && !s.done)).toBe(true);
    expect(w.exercises[0].restSeconds).toBe(120);
  });
});

describe('program sessions', () => {
  it('carries the program context into the save payload and pre-fills timed targets as seconds', () => {
    const w = M.startWorkout(new Date(), {
      id: null,
      name: 'Day A',
      program: { enrollmentId: 'enr-1', programDayId: 'day-1', label: 'Week 1 · Day A' },
      exercises: [
        { exercise: bench, targetSets: 2, targetRepsMin: 8, restSeconds: 90 },
        { exercise: plank, targetSets: 1, targetRepsMin: 40, restSeconds: 45 },
      ],
    });
    expect(w.templateId).toBeNull();
    expect(w.exercises[1].sets[0]).toMatchObject({ durationSeconds: 40, reps: null });
    const p = M.toSavePayload(w);
    expect(p).toMatchObject({ enrollment_id: 'enr-1', program_day_id: 'day-1', template_id: null });
  });

  it('sends null program fields for normal workouts', () => {
    expect(M.toSavePayload(M.startWorkout())).toMatchObject({ enrollment_id: null, program_day_id: null });
  });
});

describe('editing', () => {
  it('adds a set pre-filled from the previous one, not marked done', () => {
    let w = M.addExercises(M.startWorkout(), [bench]);
    w = fill(w, 0, 0, { weightKg: 100, reps: 5, done: true });
    w = M.addSet(w, w.exercises[0].key);
    const [, second] = w.exercises[0].sets;
    expect(second).toMatchObject({ weightKg: 100, reps: 5, done: false, isWarmup: false });
  });

  it('moves exercises within bounds and ignores out-of-range moves', () => {
    let w = M.addExercises(M.startWorkout(), [bench, plank, pullup]);
    w = M.moveExercise(w, w.exercises[0].key, 1);
    expect(w.exercises.map((e) => e.name)).toEqual(['Plank', 'Barbell Bench Press', 'Pull-Up']);
    const same = M.moveExercise(w, w.exercises[0].key, -1);
    expect(same).toBe(w);
  });

  it('removes sets and exercises', () => {
    let w = M.addExercises(M.startWorkout(), [bench, plank]);
    w = M.addSet(w, w.exercises[0].key);
    w = M.removeSet(w, w.exercises[0].key, w.exercises[0].sets[0].key);
    expect(w.exercises[0].sets).toHaveLength(1);
    w = M.removeExercise(w, w.exercises[1].key);
    expect(w.exercises).toHaveLength(1);
  });
});

describe('isSetComplete', () => {
  const base = M.emptySet();
  it('requires weight and reps for weighted exercises (0 kg allowed)', () => {
    expect(M.isSetComplete('weight_reps', { ...base, reps: 5 })).toBe(false);
    expect(M.isSetComplete('weight_reps', { ...base, reps: 5, weightKg: 0 })).toBe(true);
  });
  it('requires reps for reps-only and time for duration', () => {
    expect(M.isSetComplete('reps_only', { ...base, reps: 10 })).toBe(true);
    expect(M.isSetComplete('duration', { ...base, durationSeconds: 0 })).toBe(false);
    expect(M.isSetComplete('duration', { ...base, durationSeconds: 60 })).toBe(true);
  });
});

describe('stats and save payload', () => {
  function sampleWorkout() {
    let w = M.addExercises(M.startWorkout(new Date('2026-11-26T18:00:00Z')), [bench, plank, pullup]);
    w = fill(w, 0, 0, { weightKg: 60, reps: 10, isWarmup: true, done: true });
    w = M.addSet(w, w.exercises[0].key);
    w = fill(w, 0, 1, { weightKg: 100, reps: 5, done: true });
    w = M.addSet(w, w.exercises[0].key); // pre-filled but never ticked
    w = fill(w, 1, 0, { durationSeconds: 60, done: true });
    // pull-up exercise left untouched
    return w;
  }

  it('counts only done sets and excludes warm-ups from volume', () => {
    expect(M.workoutStats(sampleWorkout())).toEqual({ exercises: 3, sets: 3, volumeKg: 500 });
  });

  it('builds an RPC payload with only completed sets and drops empty exercises', () => {
    const w = sampleWorkout();
    const p = M.toSavePayload(w, new Date('2026-11-26T19:00:00Z'));
    expect(p.id).toBe(w.id);
    expect(p.finished_at).toBe('2026-11-26T19:00:00.000Z');
    expect(p.exercises.map((e) => e.exercise_id)).toEqual(['ex-bench', 'ex-plank']);
    expect(p.exercises[0].sets).toEqual([
      { weight_kg: 60, reps: 10, duration_seconds: null, rpe: null, is_warmup: true },
      { weight_kg: 100, reps: 5, duration_seconds: null, rpe: null, is_warmup: false },
    ]);
    expect(p.exercises[1].sets[0]).toMatchObject({ weight_kg: null, reps: null, duration_seconds: 60 });
  });

  it('falls back to a default name when blank', () => {
    const w = { ...M.startWorkout(), name: '   ' };
    expect(M.toSavePayload(w).name).toBe('Workout');
  });
});

describe('editing saved workouts', () => {
  const saved: M.SavedWorkout = {
    id: 'w1',
    name: 'Push',
    notes: null,
    started_at: '2026-11-20T10:00:00.000Z',
    workout_exercises: [
      { notes: null, exercise: { id: 'ex-bench', name: 'Barbell Bench Press', kind: 'weight_reps' }, workout_sets: [{ weight_kg: 1000, reps: 5, duration_seconds: null, rpe: null, is_warmup: false }] },
      { notes: null, exercise: null, workout_sets: [] }, // exercise no longer visible: skipped
    ],
  };

  it('loads every saved set as done and keeps the original date', () => {
    const w = M.fromSavedWorkout(saved);
    expect(w.startedAt).toBe(saved.started_at);
    expect(w.exercises).toHaveLength(1);
    expect(w.exercises[0].sets[0]).toMatchObject({ weightKg: 1000, reps: 5, done: true });
  });

  it('builds an update payload with corrected values and new sets, dropping incomplete ones', () => {
    let w = M.fromSavedWorkout(saved);
    const ex = w.exercises[0];
    w = M.updateSet(w, ex.key, ex.sets[0].key, { weightKg: 100 });
    w = M.addSet(w, ex.key); // pre-filled copy, counts even though never "ticked"
    w = M.addSet(w, ex.key);
    w = M.updateSet(w, ex.key, w.exercises[0].sets[2].key, { reps: null }); // incomplete: dropped
    const p = M.toUpdatePayload({ ...w, name: 'Push (fixed)' });
    expect(p).toMatchObject({ id: 'w1', name: 'Push (fixed)' });
    expect(p.exercises[0].sets.map((s) => [s.weight_kg, s.reps])).toEqual([[100, 5], [100, 5]]);
    expect(p).not.toHaveProperty('started_at');
  });
});

describe('applySuggestion', () => {
  it('fills weight and reps into unticked working sets only', () => {
    let w = M.startWorkout(new Date(), { id: null, name: 'Day A', exercises: [{ exercise: bench, targetSets: 3, targetRepsMin: 8, restSeconds: null }] });
    const ex = w.exercises[0];
    w = M.updateSet(w, ex.key, ex.sets[0].key, { weightKg: 80, reps: 10, done: true });
    w = M.updateSet(w, ex.key, ex.sets[1].key, { isWarmup: true, weightKg: 40 });
    w = M.applySuggestion(w, ex.key, { weightKg: 82.5, reps: 8 });
    expect(w.exercises[0].sets.map((s) => [s.weightKg, s.reps])).toEqual([[80, 10], [40, 8], [82.5, 8]]);
  });

  it('keeps weights untouched for a reps-only suggestion', () => {
    let w = M.startWorkout(new Date(), { id: null, name: 'Day A', exercises: [{ exercise: pullup, targetSets: 2, targetRepsMin: 6, restSeconds: null }] });
    w = M.applySuggestion(w, w.exercises[0].key, { weightKg: null, reps: 7 });
    expect(w.exercises[0].sets.every((s) => s.reps === 7 && s.weightKg === null)).toBe(true);
  });

  it('carries a program rep range onto the session exercise', () => {
    const w = M.startWorkout(new Date(), {
      id: null,
      name: 'Day A',
      exercises: [{ exercise: bench, targetSets: 3, targetRepsMin: 8, restSeconds: null, progression: { repsMin: 8, repsMax: 10, equipment: 'barbell' } }],
    });
    expect(w.exercises[0].progression).toEqual({ repsMin: 8, repsMax: 10, equipment: 'barbell' });
  });
});
