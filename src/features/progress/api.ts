import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { addDays, startOfWeek, toDay, userTimeZone } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

// Every stats query lives under ['stats', ...] so saving/deleting a workout can refresh them all at once.
const useUid = () => useAuth().session?.user.id;

export function usePersonalRecords() {
  const uid = useUid();
  return useQuery({
    queryKey: ['stats', 'records', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('personal_records');
      if (error) throw error;
      return data;
    },
  });
}

export function useExerciseHistory(exerciseId: string) {
  const uid = useUid();
  return useQuery({
    queryKey: ['stats', 'exercise', exerciseId, uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('exercise_history', { p_exercise_id: exerciseId });
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkoutPRs(workoutId: string, enabled = true) {
  const uid = useUid();
  return useQuery({
    queryKey: ['stats', 'workout-prs', workoutId, uid],
    enabled: !!uid && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('workout_prs', { p_workout_id: workoutId });
      if (error) throw error;
      return data;
    },
  });
}

export function useWeeklyMuscleSets(weeks = 2) {
  const uid = useUid();
  return useQuery({
    queryKey: ['stats', 'muscle-sets', weeks, uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('weekly_muscle_sets', { p_weeks: weeks, p_tz: userTimeZone() });
      if (error) throw error;
      return data;
    },
  });
}

/** Days with workouts over the last `weeks` weeks (Monday-aligned), in the user's timezone. */
export function useTrainingDays(weeks = 16) {
  const uid = useUid();
  const from = toDay(addDays(startOfWeek(new Date()), -7 * (weeks - 1)));
  return useQuery({
    queryKey: ['stats', 'training-days', from, uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('training_days', { p_from: from, p_tz: userTimeZone() });
      if (error) throw error;
      return data;
    },
  });
}

export function useBodyMeasurements() {
  const uid = useUid();
  return useQuery({
    queryKey: ['stats', 'body', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('body_measurements').select('*').order('measured_on', { ascending: true }).limit(365);
      if (error) throw error;
      return data;
    },
  });
}

/** Logs body weight for a day; logging again on the same day replaces that day's entry. */
export function useLogBodyWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ day, weightKg }: { day: string; weightKg: number }) => {
      const { error } = await supabase
        .from('body_measurements')
        .upsert({ measured_on: day, weight_kg: Math.round(weightKg * 100) / 100 }, { onConflict: 'user_id,measured_on' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stats', 'body'] }),
  });
}

export function useDeleteMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('body_measurements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stats', 'body'] }),
  });
}
