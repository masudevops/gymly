// Pure program helpers: preview stats derived from the program's own data (so they can't drift from it)
// and the editor's state <-> save_program payload mapping. Unit-tested in model.test.ts.
import type { ExerciseKind } from '@/features/workout/model';

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'full_body' | 'cardio';
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'band' | 'smith_machine' | 'other';

export type ExerciseInfo = {
  id: string;
  name: string;
  kind: ExerciseKind;
  primary_muscle: MuscleGroup;
  secondary_muscles: MuscleGroup[];
  equipment: Equipment;
};

export type DayExercise = {
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  rest_seconds: number | null;
  notes?: string | null;
  exercise: ExerciseInfo;
};

// ─── Preview stats ──────────────────────────────────────────────────────────

const WARMUP_MIN = 8;
const WORK_SECONDS_PER_SET = 40;
const SETUP_SECONDS_PER_EXERCISE = 60;
const DEFAULT_REST = 90;

/** Rough session length in minutes (warm-up, work, rest, moving between exercises), rounded to 5. */
export function estimateSessionMinutes(exercises: Pick<DayExercise, 'sets' | 'rest_seconds'>[]): number {
  const seconds = exercises.reduce(
    (t, e) => t + SETUP_SECONDS_PER_EXERCISE + e.sets * (WORK_SECONDS_PER_SET + (e.rest_seconds ?? DEFAULT_REST)),
    0,
  );
  return Math.max(5, Math.round((WARMUP_MIN + seconds / 60) / 5) * 5);
}

/** "40–55 min" across a program's days, or "45 min" when they're all the same. */
export function sessionRangeLabel(days: { exercises: Pick<DayExercise, 'sets' | 'rest_seconds'>[] }[]): string {
  if (days.length === 0) return '';
  const mins = days.map((d) => estimateSessionMinutes(d.exercises));
  const lo = Math.min(...mins);
  const hi = Math.max(...mins);
  return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
}

const COUNTED: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core'];

/**
 * Direct sets per muscle per week (one pass through the program's days): each set counts for the
 * exercise's primary muscle, the usual way weekly volume is quoted. Largest first.
 */
export function weeklySetsByMuscle(days: { exercises: DayExercise[] }[]): { muscle: MuscleGroup; sets: number }[] {
  const totals = new Map<MuscleGroup, number>();
  for (const d of days) {
    for (const e of d.exercises) {
      const m = e.exercise.primary_muscle;
      if (COUNTED.includes(m)) totals.set(m, (totals.get(m) ?? 0) + e.sets);
    }
  }
  return [...totals]
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets || COUNTED.indexOf(a.muscle) - COUNTED.indexOf(b.muscle));
}

/**
 * Muscle map highlighting: muscles with at least `primaryMin` direct sets a week are primary; muscles
 * trained lightly or only as a helper (secondary muscle of an exercise) are secondary.
 */
export function muscleMapSets(days: { exercises: DayExercise[] }[], primaryMin = 4) {
  const volume = weeklySetsByMuscle(days);
  const primary = volume.filter((v) => v.sets >= primaryMin).map((v) => v.muscle);
  const helpers = days.flatMap((d) => d.exercises.flatMap((e) => e.exercise.secondary_muscles)).filter((m) => COUNTED.includes(m));
  const secondary = [...new Set([...volume.map((v) => v.muscle), ...helpers])].filter((m) => !primary.includes(m));
  return { primary, secondary };
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  machine: 'Machines',
  cable: 'Cables',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Bands',
  smith_machine: 'Smith machine',
  other: 'Other',
};

/** Distinct equipment a program needs, in a stable display order. */
export function equipmentNeeded(days: { exercises: DayExercise[] }[]): Equipment[] {
  const order = Object.keys(EQUIPMENT_LABELS) as Equipment[];
  const used = new Set(days.flatMap((d) => d.exercises.map((e) => e.exercise.equipment)));
  return order.filter((e) => used.has(e));
}

// ─── Editor ─────────────────────────────────────────────────────────────────

export const MAX_DAYS = 7;

export type EditorExercise = {
  key: string;
  exercise: Pick<ExerciseInfo, 'id' | 'name' | 'kind'>;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  rest: number | null;
  notes: string | null;
};
export type EditorDay = { key: string; id: string | null; name: string; focus: string | null; exercises: EditorExercise[] };
export type EditorState = { name: string; weeks: number; days: EditorDay[] };

type SourceDay = { id: string; name: string; focus: string | null; exercises: DayExercise[] };

/**
 * Editor state from a program. When copying a built-in (`asCopy`), day ids are dropped so the save
 * creates new rows and the original can't be touched.
 */
export function editorFromProgram(
  p: { name: string; weeks: number; days: SourceDay[] },
  newKey: () => string,
  asCopy: boolean,
): EditorState {
  return {
    name: p.name,
    weeks: p.weeks,
    days: p.days.map((d) => ({
      key: newKey(),
      id: asCopy ? null : d.id,
      name: d.name,
      focus: d.focus,
      exercises: d.exercises.map((e) => ({
        key: newKey(),
        exercise: { id: e.exercise.id, name: e.exercise.name, kind: e.exercise.kind },
        sets: e.sets,
        repsMin: e.reps_min,
        repsMax: e.reps_max,
        rest: e.rest_seconds,
        notes: e.notes ?? null,
      })),
    })),
  };
}

/** Defaults for an exercise added in the editor. */
export function newEditorExercise(e: Pick<ExerciseInfo, 'id' | 'name' | 'kind'>, key: string): EditorExercise {
  const timed = e.kind === 'duration';
  return { key, exercise: e, sets: 3, repsMin: timed ? 30 : 8, repsMax: timed ? 45 : 12, rest: timed ? 45 : 90, notes: null };
}

/** First problem that would stop a save, or null. */
export function validateEditor(s: EditorState): string | null {
  if (!s.name.trim()) return 'Give your program a name.';
  if (s.days.length === 0) return 'Add at least one day.';
  if (s.days.length > MAX_DAYS) return `A program can have at most ${MAX_DAYS} days.`;
  const empty = s.days.find((d) => d.exercises.length === 0);
  if (empty) return `Add at least one exercise to ${empty.name.trim() || 'every day'}.`;
  const unnamed = s.days.findIndex((d) => !d.name.trim());
  if (unnamed >= 0) return `Name day ${unnamed + 1}.`;
  return null;
}

/** The save_program RPC payload. */
export function toSavePayload(s: EditorState, opts: { id: string | null; sourceProgramId: string | null }) {
  return {
    id: opts.id,
    source_program_id: opts.id ? null : opts.sourceProgramId,
    name: s.name.trim(),
    weeks: s.weeks,
    days: s.days.map((d) => ({
      id: d.id,
      name: d.name.trim(),
      focus: d.focus?.trim() || null,
      exercises: d.exercises.map((e) => {
        const lo = e.repsMin;
        const hi = e.repsMax !== null && lo !== null && e.repsMax < lo ? lo : e.repsMax;
        return { exercise_id: e.exercise.id, sets: e.sets, reps_min: lo, reps_max: hi, rest_seconds: e.rest, notes: e.notes?.trim() || null };
      }),
    })),
  };
}

export type SavePayload = ReturnType<typeof toSavePayload>;

/** Moves item i by dir within a copy of the list (no-op at the ends). */
export function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
