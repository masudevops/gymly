import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import type { DayExercise, SavePayload } from '@/features/programs/model';
import type { ExerciseKind, TemplateSeed } from '@/features/workout/model';
import type { Enums } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ProgramSummary = {
  id: string;
  owner_id: string | null;
  slug: string | null;
  name: string;
  summary: string;
  goal: Enums<'training_goal'>;
  level: Enums<'experience_level'>;
  days_per_week: number;
  weeks: number;
  equipment_note: string | null;
  featured: boolean;
  split: string | null;
  tagline: string | null;
};

const SUMMARY_COLUMNS = 'id, owner_id, slug, name, summary, goal, level, days_per_week, weeks, equipment_note, featured, split, tagline';

/** List rows carry just enough of each day to estimate session length. */
export type ProgramListItem = ProgramSummary & { program_days: { program_day_exercises: { sets: number; rest_seconds: number | null }[] }[] };

export type ProgramDay = {
  id: string;
  position: number;
  name: string;
  focus: string | null;
  program_day_exercises: (DayExercise & { id: string; position: number })[];
};

export type ProgramDetail = ProgramSummary & {
  description: string | null;
  warmup: string | null;
  progression: string | null;
  recovery: string | null;
  source_program_id: string | null;
  program_days: ProgramDay[];
};

export const LEVEL_LABELS: Record<Enums<'experience_level'>, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
export const GOAL_LABELS: Record<Enums<'training_goal'>, string> = {
  strength: 'Strength',
  muscle: 'Muscle',
  general_fitness: 'General fitness',
  endurance: 'Endurance',
  hybrid: 'Strength & size',
};

const useUid = () => useAuth().session?.user.id;

/** Listed built-ins plus the user's own programs (RLS limits rows to those two). Replaced built-ins are unlisted. */
export function usePrograms() {
  const uid = useUid();
  return useQuery({
    queryKey: ['programs', 'list', uid],
    enabled: !!uid,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select(`${SUMMARY_COLUMNS}, program_days(program_day_exercises(sets, rest_seconds))`)
        .eq('listed', true)
        .order('days_per_week')
        .order('name');
      if (error) throw error;
      return data as unknown as ProgramListItem[];
    },
  });
}

export function useProgram(id: string | undefined) {
  const uid = useUid();
  return useQuery({
    queryKey: ['programs', 'detail', id, uid],
    enabled: !!uid && !!id,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select(
          `${SUMMARY_COLUMNS}, description, warmup, progression, recovery, source_program_id, program_days(id, position, name, focus, program_day_exercises(id, position, sets, reps_min, reps_max, rest_seconds, notes, exercise:exercises(id, name, kind, primary_muscle, secondary_muscles, equipment)))`,
        )
        .eq('id', id!)
        .order('position', { referencedTable: 'program_days' })
        .order('position', { referencedTable: 'program_days.program_day_exercises' })
        .single();
      if (error) throw error;
      return data as unknown as ProgramDetail;
    },
  });
}

export function useActiveProgram() {
  const uid = useUid();
  return useQuery({
    queryKey: ['programs', 'active', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('active_program');
      if (error) throw error;
      return data[0] ?? null;
    },
  });
}

export function useStartProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const { data, error } = await supabase.rpc('start_program', { p_program_id: programId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs', 'active'] }),
  });
}

export function useLeaveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('program_enrollments')
        .update({ status: 'abandoned', ended_at: new Date().toISOString() })
        .eq('id', enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs', 'active'] }),
  });
}

/** Creates or updates one of the user's programs (see save_program). Returns the program id. */
export function useSaveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SavePayload) => {
      const { data, error } = await supabase.rpc('save_program', { payload });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
}

/** Deletes one of the user's programs; its enrollments go with it, logged workouts stay in history. */
export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
}

/** Turns a program day into a workout seed linked to the enrollment. */
export function programDaySeed(day: ProgramDay, enrollmentId: string, week: number): TemplateSeed {
  return {
    id: null,
    name: day.name,
    program: { enrollmentId, programDayId: day.id, label: `Week ${week} · ${day.name}` },
    exercises: day.program_day_exercises.map((e) => ({
      exercise: e.exercise,
      targetSets: e.sets,
      targetRepsMin: e.reps_min,
      restSeconds: e.rest_seconds,
    })),
  };
}

/** "8–10 reps", "5 reps", "30–45 s". */
export function targetLabel(e: { reps_min: number | null; reps_max: number | null; exercise: { kind: ExerciseKind } }) {
  const unit = e.exercise.kind === 'duration' ? 's' : ' reps';
  if (e.reps_min === null) return '';
  return e.reps_max && e.reps_max !== e.reps_min ? `${e.reps_min}–${e.reps_max}${unit}` : `${e.reps_min}${unit}`;
}
