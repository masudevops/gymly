-- Gymly core schema (Phase 1): profiles, exercise library, templates, workouts.
-- Conventions: weights stored in kg; every table has RLS; built-in rows have owner_id null.

-- ─── Types ──────────────────────────────────────────────────────────────────
create type public.unit_system as enum ('kg', 'lb');
create type public.training_goal as enum ('strength', 'muscle', 'general_fitness', 'endurance');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full_body', 'cardio'
);
create type public.equipment as enum (
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'smith_machine', 'other'
);
-- How a set is measured: weight x reps, reps only (bodyweight), or time.
create type public.exercise_kind as enum ('weight_reps', 'reps_only', 'duration');

-- ─── Helpers ────────────────────────────────────────────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── Profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  unit public.unit_system not null default 'kg',
  goal public.training_goal,
  experience public.experience_level,
  training_days smallint check (training_days between 1 and 7),
  rest_seconds integer not null default 90 check (rest_seconds between 0 and 900),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Exercises ──────────────────────────────────────────────────────────────
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade, -- null = built-in
  name text not null check (char_length(name) between 1 and 80),
  primary_muscle public.muscle_group not null,
  secondary_muscles public.muscle_group[] not null default '{}',
  equipment public.equipment not null,
  kind public.exercise_kind not null default 'weight_reps',
  instructions text check (char_length(instructions) <= 2000),
  created_at timestamptz not null default now()
);

-- One name per owner (and one per built-in library), case-insensitive.
create unique index exercises_owner_name_key on public.exercises (owner_id, lower(name)) nulls not distinct;
create index exercises_primary_muscle_idx on public.exercises (primary_muscle);

-- ─── Templates ──────────────────────────────────────────────────────────────
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  notes text check (char_length(notes) <= 1000),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_templates_user_idx on public.workout_templates (user_id, position);
create trigger workout_templates_updated_at before update on public.workout_templates
  for each row execute function public.set_updated_at();

create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position integer not null,
  target_sets smallint not null default 3 check (target_sets between 1 and 20),
  target_reps_min smallint check (target_reps_min between 1 and 100),
  target_reps_max smallint check (target_reps_max between 1 and 100),
  rest_seconds integer check (rest_seconds between 0 and 900),
  notes text check (char_length(notes) <= 500),
  check (target_reps_max is null or target_reps_min is null or target_reps_max >= target_reps_min)
);
create index template_exercises_template_idx on public.template_exercises (template_id, position);

-- ─── Workouts ───────────────────────────────────────────────────────────────
create table public.workouts (
  id uuid primary key default gen_random_uuid(), -- client-generated so offline retries are idempotent
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id uuid references public.workout_templates (id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  notes text check (char_length(notes) <= 2000),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (finished_at >= started_at)
);
create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position integer not null,
  notes text check (char_length(notes) <= 500)
);
create index workout_exercises_workout_idx on public.workout_exercises (workout_id, position);
create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  position integer not null,
  weight_kg numeric(6, 2) check (weight_kg >= 0),
  reps smallint check (reps between 0 and 1000),
  duration_seconds integer check (duration_seconds between 0 and 86400),
  rpe numeric(3, 1) check (rpe between 1 and 10),
  is_warmup boolean not null default false
);
create index workout_sets_we_idx on public.workout_sets (workout_exercise_id, position);

-- ─── Row-level security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "read built-in and own exercises" on public.exercises
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "manage own exercises" on public.exercises
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "own templates" on public.workout_templates
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own template exercises" on public.template_exercises
  for all to authenticated
  using (exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = (select auth.uid())))
  with check (exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = (select auth.uid())));

create policy "own workouts" on public.workouts
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own workout exercises" on public.workout_exercises
  for all to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())));
create policy "own workout sets" on public.workout_sets
  for all to authenticated
  using (exists (
    select 1 from public.workout_exercises we join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())))
  with check (exists (
    select 1 from public.workout_exercises we join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())));

-- Explicit grants (don't rely on "expose new tables automatically" in hosted projects).
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.exercises, public.workout_templates, public.template_exercises,
  public.workouts, public.workout_exercises, public.workout_sets
to authenticated;

-- ─── Functions (security invoker: RLS still applies) ────────────────────────

-- Saves a finished workout and all its exercises/sets in one transaction.
-- Idempotent on the client-generated workout id, so offline retries never duplicate.
create function public.save_workout(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_workout_id uuid := (payload ->> 'id')::uuid;
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

  insert into public.workouts (id, template_id, name, notes, started_at, finished_at)
  values (
    v_workout_id,
    nullif(payload ->> 'template_id', '')::uuid,
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

  return v_workout_id;
end $$;

-- Creates or replaces a template and its exercise list in one transaction.
create function public.save_template(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := coalesce(nullif(payload ->> 'id', '')::uuid, gen_random_uuid());
  v_ex jsonb;
  v_pos integer := 0;
begin
  insert into public.workout_templates (id, name, notes)
  values (v_id, trim(payload ->> 'name'), nullif(payload ->> 'notes', ''))
  on conflict (id) do update set name = excluded.name, notes = excluded.notes;

  delete from public.template_exercises where template_id = v_id;

  for v_ex in select * from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb)) loop
    insert into public.template_exercises (template_id, exercise_id, position, target_sets, target_reps_min, target_reps_max, rest_seconds, notes)
    values (
      v_id, (v_ex ->> 'exercise_id')::uuid, v_pos,
      coalesce((v_ex ->> 'target_sets')::smallint, 3),
      (v_ex ->> 'target_reps_min')::smallint,
      (v_ex ->> 'target_reps_max')::smallint,
      (v_ex ->> 'rest_seconds')::integer,
      nullif(v_ex ->> 'notes', '')
    );
    v_pos := v_pos + 1;
  end loop;

  return v_id;
end $$;

-- Sets from the user's most recent workout for each requested exercise ("last time" hints).
create function public.last_sets_for_exercises(exercise_ids uuid[])
returns table (exercise_id uuid, workout_started_at timestamptz, set_position integer, weight_kg numeric, reps smallint, duration_seconds integer, is_warmup boolean)
language sql stable security invoker set search_path = '' as $$
  with latest as (
    select distinct on (we.exercise_id) we.exercise_id, we.id as we_id, w.started_at
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.exercise_id = any (exercise_ids) and w.user_id = (select auth.uid())
    order by we.exercise_id, w.started_at desc
  )
  select l.exercise_id, l.started_at, s.position as set_position, s.weight_kg, s.reps, s.duration_seconds, s.is_warmup
  from latest l join public.workout_sets s on s.workout_exercise_id = l.we_id
  order by l.exercise_id, s.position;
$$;

-- Permanently deletes the caller's account; all their data cascades.
create function public.delete_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.save_workout(jsonb), public.save_template(jsonb),
  public.last_sets_for_exercises(uuid[]), public.delete_account() from public, anon;
grant execute on function public.save_workout(jsonb), public.save_template(jsonb),
  public.last_sets_for_exercises(uuid[]), public.delete_account() to authenticated;
