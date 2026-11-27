import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { uuid } from '@/features/workout/model';
import { useWorkoutStore } from '@/features/workout/store';
import type { Tables, TablesUpdate } from '@/lib/database.types';
import { userTimeZone } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

import type { ExportWorkout } from './export';

export type Profile = Tables<'profiles'>;

const AVATARS = 'avatars';

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

/** Lifetime totals for the profile header. Under ['stats'] so saving/deleting a workout refreshes it. */
export function useProfileSummary() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ['stats', 'profile-summary', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('profile_summary', { p_tz: userTimeZone() });
      if (error) throw error;
      return data[0] ?? { workouts: 0, weeks_active: 0, programs: 0 };
    },
  });
}

/** Short-lived signed URL for a private avatar file (null when there's no photo). */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['avatar', path],
    enabled: !!path,
    staleTime: 50 * 60_000, // URLs are signed for an hour
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(AVATARS).createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export type PickedImage = { uri: string; mimeType?: string | null };

/** Uploads a new photo to avatars/{uid}/, points the profile at it, then removes the old file. */
export function useSetAvatar() {
  const { session } = useAuth();
  const update = useUpdateProfile();
  return useMutation({
    mutationFn: async ({ image, previous }: { image: PickedImage | null; previous: string | null }) => {
      let path: string | null = null;
      if (image) {
        const type = image.mimeType ?? 'image/jpeg';
        const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
        path = `${session!.user.id}/${uuid()}.${ext}`;
        const body = await (await fetch(image.uri)).arrayBuffer();
        const { error } = await supabase.storage.from(AVATARS).upload(path, body, { contentType: type });
        if (error) throw error;
      }
      await update.mutateAsync({ avatar_path: path });
      // Best effort: an orphaned old file is harmless and is removed with the account.
      if (previous) await supabase.storage.from(AVATARS).remove([previous]);
    },
  });
}

/**
 * Permanently deletes the account. Storage files don't cascade from auth.users, so the caller's
 * avatar folder is emptied first; `delete_account` then removes the user and all their rows.
 */
export async function deleteAccount(userId: string) {
  const { data: files } = await supabase.storage.from(AVATARS).list(userId);
  if (files?.length) await supabase.storage.from(AVATARS).remove(files.map((f) => `${userId}/${f.name}`));
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
  useWorkoutStore.getState().discard();
  useWorkoutStore.setState({ pendingSaves: [] });
  await supabase.auth.signOut();
}

const EXPORT_PAGE = 200;

/** Every saved workout (RLS limits it to the caller's), oldest first, paged under the API row cap. */
export async function fetchAllWorkouts(): Promise<ExportWorkout[]> {
  const all: ExportWorkout[] = [];
  for (let from = 0; ; from += EXPORT_PAGE) {
    const { data, error } = await supabase
      .from('workouts')
      .select('name, started_at, finished_at, workout_exercises(position, exercise:exercises(name), workout_sets(position, weight_kg, reps, duration_seconds, rpe, is_warmup))')
      .order('started_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + EXPORT_PAGE - 1);
    if (error) throw error;
    all.push(...(data as unknown as ExportWorkout[]));
    if (data.length < EXPORT_PAGE) return all;
  }
}
