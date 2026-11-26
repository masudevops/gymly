// Pure, framework-free model of an in-progress workout. All weights in kg.
// The zustand store (store.ts) wraps these functions; tests cover them directly.

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
  sets: SetEntry[];
};

export type ActiveWorkout = {
  id: string; // client-generated; becomes workouts.id (idempotent save)
  name: string;
  notes: string;
  templateId: string | null;
  startedAt: string; // ISO
  exercises: WorkoutExercise[];
};

export type ExerciseRef = { id: string; name: string; kind: ExerciseKind };

export type TemplateSeed = {
  id: string;
  name: string;
  exercises: { exercise: ExerciseRef; targetSets: number; targetRepsMin: number | null; restSeconds: number | null }[];
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
    startedAt: now.toISOString(),
    exercises: (template?.exercises ?? []).map((t) => ({
      key: newKey(),
      exerciseId: t.exercise.id,
      name: t.exercise.name,
      kind: t.exercise.kind,
      notes: '',
      restSeconds: t.restSeconds,
      sets: Array.from({ length: Math.max(1, t.targetSets) }, () => ({ ...emptySet(), reps: t.targetRepsMin })),
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
    started_at: w.startedAt,
    finished_at: finishedAt.toISOString(),
    exercises,
  };
}

export type SavePayload = ReturnType<typeof toSavePayload>;
