import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import type { Enums, Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Exercise = Tables<'exercises'>;
export type MuscleGroup = Enums<'muscle_group'>;
export type Equipment = Enums<'equipment'>;

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  full_body: 'Full body',
  cardio: 'Cardio',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  smith_machine: 'Smith machine',
  other: 'Other',
};

/** Built-in library plus the user's custom exercises. Small and stable, so cached for long. */
export function useExercises() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['exercises', session?.user.id],
    enabled: !!session,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function filterExercises(list: Exercise[], query: string, muscle: MuscleGroup | null) {
  const q = query.trim().toLowerCase();
  return list.filter(
    (e) => (!muscle || e.primary_muscle === muscle) && (!q || e.name.toLowerCase().includes(q) || MUSCLE_LABELS[e.primary_muscle].toLowerCase().includes(q)),
  );
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: Pick<Exercise, 'name' | 'primary_muscle' | 'equipment' | 'kind'>) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...input, name: input.name.trim(), owner_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}
