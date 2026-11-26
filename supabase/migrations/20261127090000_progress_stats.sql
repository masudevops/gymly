-- Gymly Phase 2: body measurements and progress/stats functions.
-- All stat functions are security invoker (RLS applies) and only read the caller's rows.
-- Functions that group by day/week take the client's IANA timezone (e.g. 'America/Chicago').

-- ─── Body measurements ──────────────────────────────────────────────────────
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2) check (weight_kg between 20 and 400),
  body_fat_pct numeric(4, 1) check (body_fat_pct between 2 and 70),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, measured_on)
);
create index body_measurements_user_date_idx on public.body_measurements (user_id, measured_on desc);

alter table public.body_measurements enable row level security;
create policy "own measurements" on public.body_measurements
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.body_measurements to authenticated;

-- ─── Helpers ────────────────────────────────────────────────────────────────
-- Estimated 1RM (Epley). Matches src/lib/fitness.ts: 1 rep = weight; >12 reps = unreliable (null).
create function public.e1rm(weight numeric, reps integer) returns numeric
language sql immutable parallel safe set search_path = '' as $$
  select case
    when weight is null or weight <= 0 or reps is null or reps < 1 or reps > 12 then null
    when reps = 1 then weight
    else round(weight * (1 + reps / 30.0), 2)
  end
$$;

-- ─── Per-exercise history (one row per workout) ─────────────────────────────
create function public.exercise_history(p_exercise_id uuid)
returns table (
  workout_id uuid, started_at timestamptz, best_e1rm numeric, top_weight_kg numeric, top_reps integer,
  volume_kg numeric, total_reps bigint, working_sets bigint, longest_seconds integer
)
language sql stable security invoker set search_path = '' as $$
  select
    w.id,
    w.started_at,
    max(public.e1rm(s.weight_kg, s.reps)),
    (array_agg(s.weight_kg order by s.weight_kg desc nulls last, s.reps desc nulls last))[1],
    (array_agg(s.reps::integer order by s.weight_kg desc nulls last, s.reps desc nulls last))[1],
    coalesce(sum(coalesce(s.weight_kg, 0) * coalesce(s.reps, 0)), 0),
    coalesce(sum(s.reps), 0),
    count(*),
    max(s.duration_seconds)
  from public.workouts w
  join public.workout_exercises we on we.workout_id = w.id
  join public.workout_sets s on s.workout_exercise_id = we.id and not s.is_warmup
  where we.exercise_id = p_exercise_id and w.user_id = (select auth.uid())
  group by w.id, w.started_at
  order by w.started_at
$$;

-- ─── All-time records per exercise ──────────────────────────────────────────
create function public.personal_records()
returns table (
  exercise_id uuid, name text, kind public.exercise_kind, primary_muscle public.muscle_group,
  best_e1rm numeric, best_e1rm_at timestamptz, heaviest_kg numeric, most_reps integer,
  longest_seconds integer, sessions bigint, last_done timestamptz
)
language sql stable security invoker set search_path = '' as $$
  with s as (
    select we.exercise_id, w.id as workout_id, w.started_at, ws.weight_kg, ws.reps, ws.duration_seconds,
           public.e1rm(ws.weight_kg, ws.reps) as e1rm
    from public.workouts w
    join public.workout_exercises we on we.workout_id = w.id
    join public.workout_sets ws on ws.workout_exercise_id = we.id and not ws.is_warmup
    where w.user_id = (select auth.uid())
  )
  select e.id, e.name, e.kind, e.primary_muscle,
         max(s.e1rm),
         (array_agg(s.started_at order by s.e1rm desc nulls last))[1],
         max(s.weight_kg), max(s.reps)::integer, max(s.duration_seconds),
         count(distinct s.workout_id), max(s.started_at)
  from s join public.exercises e on e.id = s.exercise_id
  group by e.id, e.name, e.kind, e.primary_muscle
  order by max(s.started_at) desc
$$;

-- ─── Records set in a specific workout (vs. everything before it) ──────────
create function public.workout_prs(p_workout_id uuid)
returns table (exercise_id uuid, name text, record text, value numeric, previous numeric)
language sql stable security invoker set search_path = '' as $$
  with target as (
    select id, started_at from public.workouts where id = p_workout_id and user_id = (select auth.uid())
  ),
  sets as (
    select we.exercise_id, w.started_at, (w.id = t.id) as is_target,
           ws.weight_kg, ws.reps, ws.duration_seconds, public.e1rm(ws.weight_kg, ws.reps) as e1rm
    from target t
    join public.workouts w on w.user_id = (select auth.uid()) and w.started_at <= t.started_at
    join public.workout_exercises we on we.workout_id = w.id
    join public.workout_sets ws on ws.workout_exercise_id = we.id and not ws.is_warmup
    where we.exercise_id in (select we2.exercise_id from public.workout_exercises we2 where we2.workout_id = t.id)
  ),
  agg as (
    select exercise_id,
      max(e1rm) filter (where is_target) as e1rm_now, max(e1rm) filter (where not is_target) as e1rm_before,
      max(weight_kg) filter (where is_target) as weight_now, max(weight_kg) filter (where not is_target) as weight_before,
      max(reps) filter (where is_target) as reps_now, max(reps) filter (where not is_target) as reps_before,
      max(duration_seconds) filter (where is_target) as dur_now, max(duration_seconds) filter (where not is_target) as dur_before,
      bool_or(not is_target) as has_history
    from sets group by exercise_id
  )
  -- Only count a record when there's earlier history to beat (a first-ever session isn't a "PR").
  select a.exercise_id, e.name, r.record, r.now_v, r.before_v
  from agg a
  join public.exercises e on e.id = a.exercise_id
  cross join lateral (values
    ('e1rm', a.e1rm_now, a.e1rm_before),
    ('weight', a.weight_now, a.weight_before),
    ('reps', a.reps_now::numeric, a.reps_before::numeric),
    ('duration', a.dur_now::numeric, a.dur_before::numeric)
  ) as r(record, now_v, before_v)
  where a.has_history and r.now_v is not null and r.before_v is not null and r.now_v > r.before_v
    and (r.record <> 'reps' or e.kind = 'reps_only')
    and (r.record <> 'duration' or e.kind = 'duration')
    and (r.record not in ('e1rm', 'weight') or e.kind = 'weight_reps')
$$;

-- ─── Weekly working sets per primary muscle ─────────────────────────────────
create function public.weekly_muscle_sets(p_weeks integer, p_tz text)
returns table (week_start date, muscle public.muscle_group, sets bigint)
language sql stable security invoker set search_path = '' as $$
  select date_trunc('week', w.started_at at time zone p_tz)::date, e.primary_muscle, count(*)
  from public.workouts w
  join public.workout_exercises we on we.workout_id = w.id
  join public.exercises e on e.id = we.exercise_id
  join public.workout_sets s on s.workout_exercise_id = we.id and not s.is_warmup
  where w.user_id = (select auth.uid())
    and w.started_at >= date_trunc('week', now() at time zone p_tz) at time zone p_tz - make_interval(weeks => greatest(p_weeks, 1) - 1)
  group by 1, 2
  order by 1, 3 desc
$$;

-- ─── Days trained (for the consistency calendar and streaks) ────────────────
create function public.training_days(p_from date, p_tz text)
returns table (day date, workouts bigint, volume_kg numeric)
language sql stable security invoker set search_path = '' as $$
  select (w.started_at at time zone p_tz)::date, count(distinct w.id),
         coalesce(sum(coalesce(s.weight_kg, 0) * coalesce(s.reps, 0)) filter (where not s.is_warmup), 0)
  from public.workouts w
  left join public.workout_exercises we on we.workout_id = w.id
  left join public.workout_sets s on s.workout_exercise_id = we.id
  where w.user_id = (select auth.uid()) and (w.started_at at time zone p_tz)::date >= p_from
  group by 1
  order by 1
$$;

revoke execute on function public.exercise_history(uuid), public.personal_records(), public.workout_prs(uuid),
  public.weekly_muscle_sets(integer, text), public.training_days(date, text) from public, anon;
grant execute on function public.e1rm(numeric, integer), public.exercise_history(uuid), public.personal_records(),
  public.workout_prs(uuid), public.weekly_muscle_sets(integer, text), public.training_days(date, text) to authenticated;
