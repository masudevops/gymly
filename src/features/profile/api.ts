import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import type { Tables, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Profile = Tables<'profiles'>;

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<'profiles'>) => {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', session!.user.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData(['profile', data.id], data),
  });
}

/** Display unit for weights; falls back to kg until the profile loads. */
export function useUnit() {
  return useProfile().data?.unit ?? 'kg';
}
