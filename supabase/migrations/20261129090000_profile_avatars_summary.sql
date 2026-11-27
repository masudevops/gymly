-- Gymly: profile photos and the profile summary stats.

-- ─── Avatars ────────────────────────────────────────────────────────────────
-- Stored in a private bucket at avatars/{user_id}/{file}; the app shows them via short-lived signed URLs.
alter table public.profiles
  add column avatar_path text check (char_length(avatar_path) <= 200 and starts_with(avatar_path, id::text || '/'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Users manage only files inside their own folder.
create policy "own avatar files" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ─── Profile summary ────────────────────────────────────────────────────────
-- Completed workouts, distinct (Monday-start) weeks with a workout in the user's timezone, and
-- distinct programs ever started. Security invoker: RLS limits it to the caller's rows.
create function public.profile_summary(p_tz text)
returns table (workouts bigint, weeks_active bigint, programs bigint)
language sql stable security invoker set search_path = '' as $$
  select
    (select count(*) from public.workouts),
    (select count(distinct date_trunc('week', w.started_at at time zone p_tz)) from public.workouts w),
    (select count(distinct e.program_id) from public.program_enrollments e)
$$;

revoke execute on function public.profile_summary(text) from public, anon;
grant execute on function public.profile_summary(text) to authenticated;
