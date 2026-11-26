import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import type { TemplateSeed } from '@/features/workout/model';
import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type TemplateExerciseRow = {
  id: string;
  position: number;
  target_sets: number;
  target_reps_min: number | null;
  target_reps_max: number | null;
  rest_seconds: number | null;
  exercise: { id: string; name: string; kind: 'weight_reps' | 'reps_only' | 'duration' };
};

export type Template = { id: string; name: string; notes: string | null; template_exercises: TemplateExerciseRow[] };

const SELECT =
  'id, name, notes, template_exercises(id, position, target_sets, target_reps_min, target_reps_max, rest_seconds, exercise:exercises(id, name, kind))';

export function useTemplates() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['templates', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(SELECT)
        .order('updated_at', { ascending: false })
        .order('position', { referencedTable: 'template_exercises' });
      if (error) throw error;
      return data as unknown as Template[];
    },
  });
}

export function toTemplateSeed(t: Template): TemplateSeed {
  return {
    id: t.id,
    name: t.name,
    exercises: t.template_exercises.map((te) => ({
      exercise: te.exercise,
      targetSets: te.target_sets,
      targetRepsMin: te.target_reps_min,
      restSeconds: te.rest_seconds,
    })),
  };
}

export type TemplateDraft = {
  id?: string;
  name: string;
  notes?: string | null;
  exercises: { exercise_id: string; target_sets: number; target_reps_min: number | null; target_reps_max: number | null; rest_seconds: number | null }[];
};

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: TemplateDraft) => {
      const { data, error } = await supabase.rpc('save_template', { payload: draft as unknown as Json });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workout_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
}
