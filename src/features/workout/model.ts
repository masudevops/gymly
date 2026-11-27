// Pure, framework-free model of an in-progress workout. All weights in kg.
// The zustand store (store.ts) wraps these functions; tests cover them directly.
import type { Progression } from './overload';

export type ExerciseKind = 'weight_reps' | 'reps_only' | 'duration';

export type SetEntry = {
  key: string;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  isWarmup: boolean;
  done: boolean;
};

export type WorkoutExercise = {
  key: string;
  exerciseId: string;
  name: string;
  kind: ExerciseKind;
  notes: string;
  restSeconds: number | null; // per-exercise override from a template
  /** Rep range and equipment from a program day; drives progression hints. Absent outside program sessions. */
  progression?: Progression | null;
  sets: SetEntry[];
};

/** Set when the workout is a session of the user's active program. */
export type ProgramContext = { enrollmentId: string; programDayId: string; label: string };

export type ActiveWorkout = {
  id: string; // client-generated; becomes workouts.id (idempotent save)
  name: string;
  notes: string;
  templateId: string | null;
  program?: ProgramContext | null;
  startedAt: string; // ISO
  exercises: WorkoutExercise[];
};

export type ExerciseRef = { id: string; name: string; kind: ExerciseKind };

export type TemplateSeed = {
  id: string | null; // null for program sessions (not a saved template)
  name: string;
  program?: ProgramContext;
  exercises: { exercise: ExerciseRef; targetSets: number; targetRepsMin: number | null; restSeconds: number | null; progression?: Progression | null }[];
};

export const newKey = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** RFC 4122 v4 UUID (crypto.randomUUID where available). */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function emptySet(prev?: SetEntry): SetEntry {
  return {
    key: newKey(),
    weightKg: prev?.weightKg ?? null,
    reps: prev?.reps ?? null,
    durationSeconds: prev?.durationSeconds ?? null,
    rpe: null,
    isWarmup: false,
    done: false,
  };
}

function defaultName(date: Date): string {
  const h = date.getHours();
  const part = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  return `${part} Workout`;
}

export function startWorkout(now = new Date(), template?: TemplateSeed): ActiveWorkout {
  return {
    id: uuid(),
    name: template?.name ?? defaultName(now),
    notes: '',
    templateId: template?.id ?? null,
    program: template?.program ?? null,
    startedAt: now.toISOString(),
    exercises: (template?.exercises ?? []).map((t) => ({
      key: newKey(),
      exerciseId: t.exercise.id,
      name: t.exercise.name,
      kind: t.exercise.kind,
      notes: '',
      restSeconds: t.restSeconds,
      progression: t.progression ?? null,
      // Targets pre-fill reps (or seconds for timed exercises); weights come from "last time" hints.
      sets: Array.from({ length: Math.max(1, t.targetSets) }, () =>
        t.exercise.kind === 'duration' ? { ...emptySet(), durationSeconds: t.targetRepsMin } : { ...emptySet(), reps: t.targetRepsMin },
      ),
    })),
  };
}

export function addExercises(w: ActiveWorkout, refs: ExerciseRef[]): ActiveWorkout {
  const added = refs.map<WorkoutExercise>((r) => ({
    key: newKey(),
    exerciseId: r.id,
    name: r.name,
    kind: r.kind,
    notes: '',
    restSeconds: null,
    sets: [emptySet()],
  }));
  return { ...w, exercises: [...w.exercises, ...added] };
}

const mapExercise = (w: ActiveWorkout, exKey: string, fn: (e: WorkoutExercise) => WorkoutExercise): ActiveWorkout => ({
  ...w,
  exercises: w.exercises.map((e) => (e.key === exKey ? fn(e) : e)),
});

export function removeExercise(w: ActiveWorkout, exKey: string): ActiveWorkout {
  return { ...w, exercises: w.exercises.filter((e) => e.key !== exKey) };
}

export function moveExercise(w: ActiveWorkout, exKey: string, dir: -1 | 1): ActiveWorkout {
  const i = w.exercises.findIndex((e) => e.key === exKey);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= w.exercises.length) return w;
  const next = [...w.exercises];
  [next[i], next[j]] = [next[j], next[i]];
  return { ...w, exercises: next };
}

/** Adds a set pre-filled from the previous one (most people repeat the same weight). */
export function addSet(w: ActiveWorkout, exKey: string): ActiveWorkout {
  return mapExercise(w, exKey, (e) => ({ ...e, sets: [...e.sets, emptySet(e.sets[e.sets.length - 1])] }));
}

export function updateSet(w: ActiveWorkout, exKey: string, setKey: string, patch: Partial<Omit<SetEntry, 'key'>>): ActiveWorkout {
  return mapExercise(w, exKey, (e) => ({ ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) }));
}

/** Applies a progression hint: fills weight and reps into working sets that aren't ticked yet. */
export function applySuggestion(w: ActiveWorkout, exKey: string, values: { weightKg: number | null; reps: number }): ActiveWorkout {
  return mapExercise(w, exKey, (e) => ({
    ...e,
    sets: e.sets.map((s) =>
      s.done || s.isWarmup ? s : { ...s, reps: values.reps, weightKg: e.kind === 'weight_reps' && values.weightKg !== null ? values.weightKg : s.weightKg },
    ),
  }));
}

export function removeSet(w: ActiveWorkout, exKey: string, setKey: string): ActiveWorkout {
  return mapExercise(w, exKey, (e) => ({ ...e, sets: e.sets.filter((s) => s.key !== setKey) }));
}

/** A set is loggable once it has the values its exercise kind needs. */
export function isSetComplete(kind: ExerciseKind, s: SetEntry): boolean {
  if (kind === 'duration') return (s.durationSeconds ?? 0) > 0;
  if (kind === 'reps_only') return (s.reps ?? 0) > 0;
  return (s.reps ?? 0) > 0 && s.weightKg !== null && s.weightKg >= 0;
}

export function workoutStats(w: ActiveWorkout) {
  let sets = 0;
  let volumeKg = 0;
  for (const e of w.exercises) {
    for (const s of e.sets) {
      if (!s.done) continue;
      sets += 1;
      if (!s.isWarmup && e.kind === 'weight_reps') volumeKg += (s.weightKg ?? 0) * (s.reps ?? 0);
    }
  }
  return { exercises: w.exercises.length, sets, volumeKg };
}

/** Payload for the save_workout RPC: only completed sets; exercises without any are dropped. */
export function toSavePayload(w: ActiveWorkout, finishedAt = new Date()) {
  const exercises = w.exercises
    .map((e) => ({
      exercise_id: e.exerciseId,
      notes: e.notes || null,
      sets: e.sets
        .filter((s) => s.done && isSetComplete(e.kind, s))
        .map((s) => ({
          weight_kg: e.kind === 'weight_reps' ? s.weightKg : null,
          reps: e.kind === 'duration' ? null : s.reps,
          duration_seconds: e.kind === 'duration' ? s.durationSeconds : null,
          rpe: s.rpe,
          is_warmup: s.isWarmup,
        })),
    }))
    .filter((e) => e.sets.length > 0);

  return {
    id: w.id,
    name: w.name.trim() || 'Workout',
    notes: w.notes.trim() || null,
    template_id: w.templateId,
    enrollment_id: w.program?.enrollmentId ?? null,
    program_day_id: w.program?.programDayId ?? null,
    started_at: w.startedAt,
    finished_at: finishedAt.toISOString(),
    exercises,
  };
}

export type SavePayload = ReturnType<typeof toSavePayload>;

/** A saved workout as loaded for editing (shape of useWorkoutDetail). */
export type SavedWorkout = {
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
  workout_exercises: {
    notes: string | null;
    exercise: { id: string; name: string; kind: ExerciseKind } | null;
    workout_sets: { weight_kg: number | null; reps: number | null; duration_seconds: number | null; rpe: number | null; is_warmup: boolean }[];
  }[];
};

/** Turns a saved workout into the editable model. Every saved set counts as done. */
export function fromSavedWorkout(w: SavedWorkout): ActiveWorkout {
  return {
    id: w.id,
    name: w.name,
    notes: w.notes ?? '',
    templateId: null,
    program: null,
    startedAt: w.started_at,
    exercises: w.workout_exercises
      .filter((we) => we.exercise)
      .map((we) => ({
        key: newKey(),
        exerciseId: we.exercise!.id,
        name: we.exercise!.name,
        kind: we.exercise!.kind,
        notes: we.notes ?? '',
        restSeconds: null,
        sets: we.workout_sets.map((s) => ({
          key: newKey(),
          weightKg: s.weight_kg === null ? null : Number(s.weight_kg),
          reps: s.reps,
          durationSeconds: s.duration_seconds,
          rpe: s.rpe === null ? null : Number(s.rpe),
          isWarmup: s.is_warmup,
          done: true,
        })),
      })),
  };
}

/** Payload for update_workout: like a save, but every complete set is kept (no "done" ticks when editing). */
export function toUpdatePayload(w: ActiveWorkout) {
  const all = { ...w, exercises: w.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: true })) })) };
  const { id, name, notes, exercises } = toSavePayload(all);
  return { id, name, notes, exercises };
}

export type UpdatePayload = ReturnType<typeof toUpdatePayload>;
