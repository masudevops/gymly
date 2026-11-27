-- Progressive overload hints (program sessions): a per-user switch and the recent history the hints read.

alter table public.profiles add column progression_hints boolean not null default true;

-- Sets from the user's last `sessions` workouts for each requested exercise, newest first
-- (session_index 0 = most recent). Invoker rights, so RLS limits it to the caller's own workouts.
create function public.recent_sets_for_exercises(exercise_ids uuid[], sessions integer default 3)
returns table (exercise_id uuid, session_index integer, workout_started_at timestamptz, set_position integer, weight_kg numeric, reps smallint, duration_seconds integer, is_warmup boolean)
language sql stable security invoker set search_path = '' as $$
  with ranked as (
    select we.exercise_id, we.id as we_id, w.started_at,
      (row_number() over (partition by we.exercise_id order by w.started_at desc, we.position desc) - 1)::integer as session_index
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.exercise_id = any (exercise_ids) and w.user_id = (select auth.uid())
  )
  select r.exercise_id, r.session_index, r.started_at, s.position, s.weight_kg, s.reps, s.duration_seconds, s.is_warmup
  from ranked r join public.workout_sets s on s.workout_exercise_id = r.we_id
  where r.session_index < least(greatest(sessions, 1), 10)
  order by r.exercise_id, r.session_index, s.position;
$$;

revoke execute on function public.recent_sets_for_exercises(uuid[], integer) from public, anon;
grant execute on function public.recent_sets_for_exercises(uuid[], integer) to authenticated;
