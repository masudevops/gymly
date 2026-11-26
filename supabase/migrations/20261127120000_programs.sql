-- Gymly Phase 3: training programs.
-- Programs are sequences of training days repeated for N weeks. Progress is session-based:
-- the next session is simply the next one in order, so missing a calendar day doesn't break a plan.

create type public.enrollment_status as enum ('active', 'completed', 'abandoned');

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade, -- null = built-in
  slug text unique,
  name text not null check (char_length(name) between 1 and 80),
  summary text not null check (char_length(summary) <= 200),
  description text check (char_length(description) <= 2000),
  goal public.training_goal not null,
  level public.experience_level not null,
  days_per_week smallint not null check (days_per_week between 1 and 7),
  weeks smallint not null check (weeks between 1 and 52),
  equipment_note text check (char_length(equipment_note) <= 120),
  created_at timestamptz not null default now()
);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  position smallint not null,
  name text not null check (char_length(name) between 1 and 60),
  focus text check (char_length(focus) <= 120),
  unique (program_id, position)
);

create table public.program_day_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position smallint not null,
  sets smallint not null check (sets between 1 and 10),
  reps_min smallint check (reps_min between 1 and 600), -- seconds for duration exercises
  reps_max smallint check (reps_max between 1 and 600),
  rest_seconds integer check (rest_seconds between 0 and 600),
  notes text check (char_length(notes) <= 300),
  unique (program_day_id, position)
);

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete restrict,
  status public.enrollment_status not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
-- At most one active program per user.
create unique index program_enrollments_one_active on public.program_enrollments (user_id) where status = 'active';
create index program_enrollments_user_idx on public.program_enrollments (user_id, started_at desc);

alter table public.workouts
  add column enrollment_id uuid references public.program_enrollments (id) on delete set null,
  add column program_day_id uuid references public.program_days (id) on delete set null;
create index workouts_enrollment_idx on public.workouts (enrollment_id) where enrollment_id is not null;

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.program_day_exercises enable row level security;
alter table public.program_enrollments enable row level security;

create policy "read built-in and own programs" on public.programs
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "read days of visible programs" on public.program_days
  for select to authenticated using (exists (select 1 from public.programs p where p.id = program_id));
create policy "read exercises of visible program days" on public.program_day_exercises
  for select to authenticated using (exists (select 1 from public.program_days d where d.id = program_day_id));
create policy "own enrollments" on public.program_enrollments
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on public.programs, public.program_days, public.program_day_exercises to authenticated;
grant select, insert, update on public.program_enrollments to authenticated;

-- ─── Functions ──────────────────────────────────────────────────────────────

-- Starts a program, ending any currently active one (marked abandoned).
create function public.start_program(p_program_id uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  update public.program_enrollments set status = 'abandoned', ended_at = now()
  where user_id = (select auth.uid()) and status = 'active';
  insert into public.program_enrollments (program_id) values (p_program_id) returning id into v_id;
  return v_id;
end $$;

-- The caller's active program with progress, or no rows.
create function public.active_program()
returns table (
  enrollment_id uuid, program_id uuid, name text, days_per_week smallint, weeks smallint,
  started_at timestamptz, sessions_done bigint, total_sessions integer,
  next_day_id uuid, next_day_name text, next_week integer, last_session_at timestamptz
)
language sql stable security invoker set search_path = '' as $$
  with e as (
    select pe.id, pe.program_id, pe.started_at, p.name, p.days_per_week, p.weeks
    from public.program_enrollments pe join public.programs p on p.id = pe.program_id
    where pe.user_id = (select auth.uid()) and pe.status = 'active'
  ),
  done as (
    select count(*) as n, max(w.started_at) as last_at
    from e join public.workouts w on w.enrollment_id = e.id
  ),
  nd as (
    select (select n from done) % e.days_per_week as day_index from e
  )
  select e.id, e.program_id, e.name, e.days_per_week, e.weeks, e.started_at,
         (select n from done), (e.days_per_week * e.weeks)::integer,
         d.id, d.name, ((select n from done) / e.days_per_week + 1)::integer, (select last_at from done)
  from e
  left join public.program_days d on d.program_id = e.program_id and d.position = (select day_index from nd)
$$;

-- save_workout v2: links program sessions and completes the program after its final session.
create or replace function public.save_workout(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_workout_id uuid := (payload ->> 'id')::uuid;
  v_enrollment uuid := nullif(payload ->> 'enrollment_id', '')::uuid;
  v_ex jsonb;
  v_set jsonb;
  v_we_id uuid;
  v_ex_pos integer := 0;
  v_set_pos integer;
begin
  if v_workout_id is null then raise exception 'workout id is required'; end if;

  if exists (select 1 from public.workouts where id = v_workout_id) then
    return v_workout_id; -- already saved (retry)
  end if;

  -- Only link to the caller's own active enrollment; otherwise save as a normal workout.
  if v_enrollment is not null and not exists (
    select 1 from public.program_enrollments
    where id = v_enrollment and user_id = (select auth.uid()) and status = 'active'
  ) then
    v_enrollment := null;
  end if;

  insert into public.workouts (id, template_id, enrollment_id, program_day_id, name, notes, started_at, finished_at)
  values (
    v_workout_id,
    nullif(payload ->> 'template_id', '')::uuid,
    v_enrollment,
    case when v_enrollment is null then null else nullif(payload ->> 'program_day_id', '')::uuid end,
    coalesce(nullif(trim(payload ->> 'name'), ''), 'Workout'),
    nullif(payload ->> 'notes', ''),
    (payload ->> 'started_at')::timestamptz,
    (payload ->> 'finished_at')::timestamptz
  );

  for v_ex in select * from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb)) loop
    insert into public.workout_exercises (workout_id, exercise_id, position, notes)
    values (v_workout_id, (v_ex ->> 'exercise_id')::uuid, v_ex_pos, nullif(v_ex ->> 'notes', ''))
    returning id into v_we_id;
    v_ex_pos := v_ex_pos + 1;

    v_set_pos := 0;
    for v_set in select * from jsonb_array_elements(coalesce(v_ex -> 'sets', '[]'::jsonb)) loop
      insert into public.workout_sets (workout_exercise_id, position, weight_kg, reps, duration_seconds, rpe, is_warmup)
      values (
        v_we_id, v_set_pos,
        (v_set ->> 'weight_kg')::numeric,
        (v_set ->> 'reps')::smallint,
        (v_set ->> 'duration_seconds')::integer,
        (v_set ->> 'rpe')::numeric,
        coalesce((v_set ->> 'is_warmup')::boolean, false)
      );
      v_set_pos := v_set_pos + 1;
    end loop;
  end loop;

  -- Final session of the program: mark it completed.
  if v_enrollment is not null then
    update public.program_enrollments pe set status = 'completed', ended_at = now()
    from public.programs p
    where pe.id = v_enrollment and p.id = pe.program_id
      and (select count(*) from public.workouts w where w.enrollment_id = v_enrollment) >= p.days_per_week * p.weeks;
  end if;

  return v_workout_id;
end $$;

revoke execute on function public.start_program(uuid), public.active_program() from public, anon;
grant execute on function public.start_program(uuid), public.active_program() to authenticated;
