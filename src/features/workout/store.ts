import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as M from './model';

type RestTimer = { endsAt: number; totalSeconds: number } | null;

type WorkoutState = {
  active: M.ActiveWorkout | null;
  rest: RestTimer;
  /** Finished workouts not yet confirmed by the server (offline). Retried until saved. */
  pendingSaves: M.SavePayload[];

  start: (template?: M.TemplateSeed) => void;
  discard: () => void;
  rename: (name: string) => void;
  setNotes: (notes: string) => void;
  addExercises: (refs: M.ExerciseRef[]) => void;
  removeExercise: (exKey: string) => void;
  moveExercise: (exKey: string, dir: -1 | 1) => void;
  addSet: (exKey: string) => void;
  updateSet: (exKey: string, setKey: string, patch: Partial<Omit<M.SetEntry, 'key'>>) => void;
  removeSet: (exKey: string, setKey: string) => void;
  startRest: (seconds: number) => void;
  adjustRest: (deltaSeconds: number) => void;
  stopRest: () => void;
  /** Moves the active workout into the pending queue and returns its payload. */
  finish: () => M.SavePayload | null;
  markSaved: (id: string) => void;
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => {
      const edit = (fn: (w: M.ActiveWorkout) => M.ActiveWorkout) => {
        const { active } = get();
        if (active) set({ active: fn(active) });
      };
      return {
        active: null,
        rest: null,
        pendingSaves: [],

        start: (template) => set({ active: M.startWorkout(new Date(), template), rest: null }),
        discard: () => set({ active: null, rest: null }),
        rename: (name) => edit((w) => ({ ...w, name })),
        setNotes: (notes) => edit((w) => ({ ...w, notes })),
        addExercises: (refs) => edit((w) => M.addExercises(w, refs)),
        removeExercise: (k) => edit((w) => M.removeExercise(w, k)),
        moveExercise: (k, d) => edit((w) => M.moveExercise(w, k, d)),
        addSet: (k) => edit((w) => M.addSet(w, k)),
        updateSet: (k, s, p) => edit((w) => M.updateSet(w, k, s, p)),
        removeSet: (k, s) => edit((w) => M.removeSet(w, k, s)),

        startRest: (seconds) => set({ rest: seconds > 0 ? { endsAt: Date.now() + seconds * 1000, totalSeconds: seconds } : null }),
        adjustRest: (delta) => {
          const { rest } = get();
          if (!rest) return;
          const endsAt = rest.endsAt + delta * 1000;
          set({ rest: endsAt <= Date.now() ? null : { endsAt, totalSeconds: Math.max(1, rest.totalSeconds + delta) } });
        },
        stopRest: () => set({ rest: null }),

        finish: () => {
          const { active, pendingSaves } = get();
          if (!active) return null;
          const payload = M.toSavePayload(active);
          set({ active: null, rest: null, pendingSaves: [...pendingSaves.filter((p) => p.id !== payload.id), payload] });
          return payload;
        },
        markSaved: (id) => set({ pendingSaves: get().pendingSaves.filter((p) => p.id !== id) }),
      };
    },
    {
      name: 'gymly-workout',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ active: s.active, rest: s.rest, pendingSaves: s.pendingSaves }),
    },
  ),
);
