import {
  editorFromProgram,
  equipmentNeeded,
  estimateSessionMinutes,
  move,
  muscleMapSets,
  sessionRangeLabel,
  toSavePayload,
  validateEditor,
  weeklySetsByMuscle,
  type DayExercise,
  type ExerciseInfo,
} from './model';

const ex = (name: string, primary: ExerciseInfo['primary_muscle'], secondary: ExerciseInfo['secondary_muscles'] = [], equipment: ExerciseInfo['equipment'] = 'barbell'): ExerciseInfo => ({
  id: name.toLowerCase().replace(/\s/g, '-'),
  name,
  kind: 'weight_reps',
  primary_muscle: primary,
  secondary_muscles: secondary,
  equipment,
});
const row = (e: ExerciseInfo, sets: number, rest = 90): DayExercise => ({ exercise: e, sets, reps_min: 8, reps_max: 10, rest_seconds: rest });

const bench = ex('Bench Press', 'chest', ['triceps', 'shoulders']);
const row1 = ex('Barbell Row', 'back', ['biceps']);
const curl = ex('Dumbbell Curl', 'biceps', [], 'dumbbell');

describe('estimateSessionMinutes', () => {
  it('adds warm-up, work, rest and setup, rounded to 5', () => {
    // 8 min warm-up + 2 exercises × 60 s setup + 6 sets × (40 s + 90 s) = 8 + 2 + 13 = 23 → 25
    expect(estimateSessionMinutes([{ sets: 3, rest_seconds: 90 }, { sets: 3, rest_seconds: 90 }])).toBe(25);
  });
  it('uses a default rest when none is set', () => {
    expect(estimateSessionMinutes([{ sets: 3, rest_seconds: null }])).toBe(estimateSessionMinutes([{ sets: 3, rest_seconds: 90 }]));
  });
  it('never returns less than 5 minutes', () => {
    expect(estimateSessionMinutes([])).toBe(10);
  });
});

describe('sessionRangeLabel', () => {
  it('shows a range across days, or one value', () => {
    const short = { exercises: [{ sets: 2, rest_seconds: 60 }] };
    const long = { exercises: Array.from({ length: 6 }, () => ({ sets: 4, rest_seconds: 120 })) };
    expect(sessionRangeLabel([short, short])).toMatch(/^\d+ min$/);
    expect(sessionRangeLabel([short, long])).toMatch(/^\d+–\d+ min$/);
  });
});

describe('weeklySetsByMuscle', () => {
  it('counts direct sets for each exercise\'s primary muscle', () => {
    const v = weeklySetsByMuscle([{ exercises: [row(bench, 4), row(row1, 4)] }, { exercises: [row(bench, 2), row(curl, 3)] }]);
    expect(v).toEqual([
      { muscle: 'chest', sets: 6 },
      { muscle: 'back', sets: 4 },
      { muscle: 'biceps', sets: 3 },
    ]);
  });
  it('ignores cardio and full-body tags', () => {
    const run = ex('Run', 'cardio');
    expect(weeklySetsByMuscle([{ exercises: [row(run, 1)] }])).toEqual([]);
  });
});

describe('muscleMapSets', () => {
  it('marks well-trained muscles primary and helpers or light work secondary', () => {
    const m = muscleMapSets([{ exercises: [row(bench, 6), row(curl, 2)] }]);
    expect(m.primary).toEqual(['chest']);
    expect(m.secondary.sort()).toEqual(['biceps', 'shoulders', 'triceps']);
  });
});

describe('equipmentNeeded', () => {
  it('lists distinct equipment in a stable order', () => {
    expect(equipmentNeeded([{ exercises: [row(curl, 2), row(bench, 3), row(curl, 2)] }])).toEqual(['barbell', 'dumbbell']);
  });
});

describe('editor', () => {
  let n = 0;
  const key = () => `k${n++}`;
  const program = {
    name: 'PPL',
    weeks: 8,
    days: [{ id: 'day-1', name: 'Push', focus: 'Chest', exercises: [{ ...row(bench, 3), notes: 'Alt: Dumbbell Bench Press' }] }],
  };

  it('drops day ids when copying so the original is never updated', () => {
    expect(editorFromProgram(program, key, true).days[0].id).toBeNull();
    expect(editorFromProgram(program, key, false).days[0].id).toBe('day-1');
  });

  it('builds the save payload, trimming text and fixing inverted rep ranges', () => {
    const s = editorFromProgram(program, key, true);
    s.name = '  My PPL  ';
    s.days[0].exercises[0].repsMax = 5; // below min
    const payload = toSavePayload(s, { id: null, sourceProgramId: 'src' });
    expect(payload).toMatchObject({ id: null, source_program_id: 'src', name: 'My PPL', weeks: 8 });
    expect(payload.days[0]).toMatchObject({ id: null, name: 'Push', focus: 'Chest' });
    expect(payload.days[0].exercises[0]).toMatchObject({ exercise_id: 'bench-press', sets: 3, reps_min: 8, reps_max: 8, notes: 'Alt: Dumbbell Bench Press' });
  });

  it('only sends a source when creating', () => {
    const s = editorFromProgram(program, key, false);
    expect(toSavePayload(s, { id: 'mine', sourceProgramId: 'src' }).source_program_id).toBeNull();
  });

  it('validates name, days and exercises', () => {
    const s = editorFromProgram(program, key, true);
    expect(validateEditor(s)).toBeNull();
    expect(validateEditor({ ...s, name: ' ' })).toMatch(/name/);
    expect(validateEditor({ ...s, days: [] })).toMatch(/at least one day/);
    expect(validateEditor({ ...s, days: [{ ...s.days[0], exercises: [] }] })).toMatch(/Push/);
    expect(validateEditor({ ...s, days: [{ ...s.days[0], name: '' }] })).toMatch(/exercise|Name day 1/);
    expect(validateEditor({ ...s, days: Array.from({ length: 8 }, () => s.days[0]) })).toMatch(/at most 7/);
  });
});

describe('move', () => {
  it('swaps neighbours and ignores moves past the ends', () => {
    expect(move([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(move([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(move([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
  });
});
