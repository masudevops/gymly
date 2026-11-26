import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { SavePayload } from './model';
import { useWorkoutStore } from './store';

const PAGE = 20;

async function saveOne(payload: SavePayload) {
  const { error } = await supabase.rpc('save_workout', { payload: payload as unknown as Json });
  if (error) throw error;
}

/**
 * Pushes finished workouts that haven't reached the server yet (offline, crash, closed tab).
 * Runs on mount, when the app returns to the foreground, and whenever a workout is finished.
 * Saving is idempotent on the workout id, so retries are safe.
 */
export function usePendingSaveSync() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const pending = useWorkoutStore((s) => s.pendingSaves);
  const markSaved = useWorkoutStore((s) => s.markSaved);
  const running = useRef(false);

  const flush = useCallback(async () => {
    if (!session || running.current) return;
    const queue = useWorkoutStore.getState().pendingSaves;
    if (queue.length === 0) return;
    running.current = true;
    try {
      for (const p of queue) {
        try {
          await saveOne(p);
          markSaved(p.id);
        } catch {
          break; // probably offline; keep the rest queued for next time
        }
      }
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['last-sets'] });
    } finally {
      running.current = false;
    }
  }, [session, markSaved, queryClient]);

  useEffect(() => {
    flush();
  }, [flush, pending.length]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && flush());
    return () => sub.remove();
  }, [flush]);

  return { pendingCount: pending.length, flush };
}

export type WorkoutSummary = {
  id: string;
  name: string;
  started_at: string;
  finished_at: string;
  workout_exercises: { id: string; exercise: { name: string } | null; workout_sets: { weight_kg: number | null; reps: number | null; is_warmup: boolean }[] }[];
};

export function useWorkoutHistory() {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: ['workouts', 'history', session?.user.id],
    enabled: !!session,
    initialPageParam: 0,
    getNextPageParam: (last: WorkoutSummary[], all) => (last.length === PAGE ? all.length * PAGE : undefined),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, started_at, finished_at, workout_exercises(id, exercise:exercises(name), workout_sets(weight_kg, reps, is_warmup))')
        .order('started_at', { ascending: false })
        .order('position', { referencedTable: 'workout_exercises' })
        .range(pageParam, pageParam + PAGE - 1);
      if (error) throw error;
      return data as unknown as WorkoutSummary[];
    },
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery({
    queryKey: ['workouts', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(
          'id, name, notes, started_at, finished_at, workout_exercises(id, position, notes, exercise:exercises(id, name, kind), workout_sets(id, position, weight_kg, reps, duration_seconds, rpe, is_warmup))',
        )
        .eq('id', id)
        .order('position', { referencedTable: 'workout_exercises' })
        .order('position', { referencedTable: 'workout_exercises.workout_sets' })
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['last-sets'] });
    },
  });
}

export type LastSet = { set_position: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; is_warmup: boolean };

/** "Last time" numbers for each exercise in the active workout, keyed by exercise id. */
export function useLastSets(exerciseIds: string[]) {
  const ids = [...new Set(exerciseIds)].sort();
  return useQuery({
    queryKey: ['last-sets', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('last_sets_for_exercises', { exercise_ids: ids });
      if (error) throw error;
      const map: Record<string, LastSet[]> = {};
      for (const row of data) (map[row.exercise_id] ??= []).push(row);
      return map;
    },
  });
}
