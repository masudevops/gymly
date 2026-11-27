-- Programs v2: richer program metadata, featured programs, a fuller built-in library, and personal
-- (user-owned) programs that users create from scratch or copy from a built-in and edit.
--
-- Built-in programs that change structure get a new slug; the old version is unlisted, not edited,
-- so anyone enrolled in it keeps exactly the plan they started. User copies are deep copies, so
-- later changes to a built-in never reach them.

-- ─── Schema ─────────────────────────────────────────────────────────────────
alter table public.programs
  add column listed boolean not null default true, -- false = hidden from the catalog (kept for existing enrollments)
  add column featured boolean not null default false,
  add column split text check (char_length(split) <= 40),
  add column tagline text check (char_length(tagline) <= 60),
  add column warmup text check (char_length(warmup) <= 600),
  add column progression text check (char_length(progression) <= 800),
  add column recovery text check (char_length(recovery) <= 600),
  add column source_program_id uuid references public.programs (id) on delete set null, -- what a user copy was made from
  add column updated_at timestamptz not null default now(),
  -- Slugs and the featured flag belong to built-ins; users can't claim a slug a future migration needs.
  add constraint programs_user_rows_plain check (owner_id is null or (slug is null and not featured));

create index programs_owner_idx on public.programs (owner_id) where owner_id is not null;

create trigger programs_set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();

-- Deleting a personal program removes its enrollments; their workouts stay in history (enrollment_id set null).
alter table public.program_enrollments
  drop constraint program_enrollments_program_id_fkey,
  add constraint program_enrollments_program_id_fkey foreign key (program_id) references public.programs (id) on delete cascade;

-- ─── RLS: users manage their own programs; built-ins stay read-only ─────────
create policy "insert own programs" on public.programs
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "update own programs" on public.programs
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "delete own programs" on public.programs
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "manage days of own programs" on public.program_days
  for all to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.programs p where p.id = program_id and p.owner_id = (select auth.uid())));

create policy "manage exercises of own program days" on public.program_day_exercises
  for all to authenticated
  using (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.owner_id = (select auth.uid())
  ));

grant insert, update, delete on public.programs, public.program_days, public.program_day_exercises to authenticated;

-- ─── Functions ──────────────────────────────────────────────────────────────

-- start_program v2: only programs the caller can see (built-in or their own).
create or replace function public.start_program(p_program_id uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.programs where id = p_program_id) then
    raise exception 'program not found';
  end if;
  update public.program_enrollments set status = 'abandoned', ended_at = now()
  where user_id = (select auth.uid()) and status = 'active';
  insert into public.program_enrollments (program_id) values (p_program_id) returning id into v_id;
  return v_id;
end $$;

-- Creates or updates one of the caller's programs in a single call.
-- payload: { id?, source_program_id?, name, summary?, weeks?, days: [{ id?, name, focus?, exercises: [
--   { exercise_id, sets, reps_min?, reps_max?, rest_seconds?, notes? } ] }] }
-- New programs copy goal, level and guidance from source_program_id when given.
-- Day positions are renumbered 0..n-1 and days_per_week = n, which active_program() relies on.
create function public.save_program(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := nullif(payload ->> 'id', '')::uuid;
  v_source_id uuid := nullif(payload ->> 'source_program_id', '')::uuid;
  v_n integer := coalesce(jsonb_array_length(payload -> 'days'), 0);
  src public.programs;
  d jsonb; x jsonb;
  v_day uuid; v_keep uuid[] := '{}';
  v_pos smallint := 0; v_ex_pos smallint;
begin
  if (select auth.uid()) is null then raise exception 'not signed in'; end if;
  if v_n < 1 or v_n > 7 then raise exception 'a program needs 1 to 7 days'; end if;

  if v_id is null then
    if v_source_id is not null then
      select * into src from public.programs where id = v_source_id; -- RLS: built-in or own
      if not found then raise exception 'source program not found'; end if;
    end if;
    insert into public.programs (
      owner_id, name, summary, description, goal, level, days_per_week, weeks, equipment_note,
      split, warmup, progression, recovery, source_program_id
    ) values (
      (select auth.uid()), payload ->> 'name',
      coalesce(nullif(payload ->> 'summary', ''), src.summary, 'Your custom program.'),
      src.description,
      coalesce(src.goal, 'general_fitness'), coalesce(src.level, 'intermediate'),
      v_n, coalesce((payload ->> 'weeks')::smallint, src.weeks, 8), src.equipment_note,
      src.split, src.warmup, src.progression, src.recovery,
      v_source_id
    ) returning id into v_id;
  else
    update public.programs
    set name = payload ->> 'name',
        summary = coalesce(nullif(payload ->> 'summary', ''), summary),
        weeks = coalesce((payload ->> 'weeks')::smallint, weeks),
        days_per_week = v_n
    where id = v_id and owner_id = (select auth.uid());
    if not found then raise exception 'program not found'; end if;
    -- Park existing days out of the way so they can be renumbered without unique conflicts.
    update public.program_days set position = position + 100 where program_id = v_id;
  end if;

  for d in select * from jsonb_array_elements(payload -> 'days') loop
    if coalesce(jsonb_array_length(d -> 'exercises'), 0) = 0 then
      raise exception 'every day needs at least one exercise';
    end if;

    v_day := nullif(d ->> 'id', '')::uuid;
    if v_day is not null then
      update public.program_days set position = v_pos, name = d ->> 'name', focus = nullif(d ->> 'focus', '')
      where id = v_day and program_id = v_id;
      if not found then v_day := null; end if;
    end if;
    if v_day is null then
      insert into public.program_days (program_id, position, name, focus)
      values (v_id, v_pos, d ->> 'name', nullif(d ->> 'focus', '')) returning id into v_day;
    end if;
    v_keep := v_keep || v_day;

    delete from public.program_day_exercises where program_day_id = v_day;
    v_ex_pos := 0;
    for x in select * from jsonb_array_elements(d -> 'exercises') loop
      -- RLS-checked: only built-in or the caller's own exercises.
      if not exists (select 1 from public.exercises where id = (x ->> 'exercise_id')::uuid) then
        raise exception 'unknown exercise %', x ->> 'exercise_id';
      end if;
      insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps_min, reps_max, rest_seconds, notes)
      values (
        v_day, (x ->> 'exercise_id')::uuid, v_ex_pos, (x ->> 'sets')::smallint,
        nullif(x ->> 'reps_min', '')::smallint, nullif(x ->> 'reps_max', '')::smallint,
        nullif(x ->> 'rest_seconds', '')::integer, nullif(x ->> 'notes', '')
      );
      v_ex_pos := v_ex_pos + 1;
    end loop;
    v_pos := v_pos + 1;
  end loop;

  -- Removed days go; workouts that used them keep their history (program_day_id set null).
  delete from public.program_days where program_id = v_id and not (id = any (v_keep));
  return v_id;
end $$;

-- ─── Library: one new exercise ──────────────────────────────────────────────
insert into public.exercises (name, primary_muscle, secondary_muscles, equipment, kind, instructions, form_tip)
select 'Dumbbell Pullover', 'chest', '{back,triceps}', 'dumbbell', 'weight_reps',
  E'Lie on a flat bench and hold one dumbbell over your chest with both hands, elbows slightly bent.\nLower the dumbbell back behind your head in an arc until you feel a stretch through your chest and lats.\nPull it back over your chest along the same arc without changing the bend in your elbows.',
  'Move only at the shoulders; if your elbows bend and straighten, it turns into a triceps exercise.'
where not exists (select 1 from public.exercises where owner_id is null and lower(name) = 'dumbbell pullover');

-- ─── Built-in programs ──────────────────────────────────────────────────────
-- Same loader idea as earlier program migrations, plus the new metadata. Each exercise is
-- [name, sets, reps_min, reps_max, rest_seconds, notes?] (seconds instead of reps for timed exercises).
-- Idempotent on slug; unknown exercise names abort the migration.
do $$
declare
  warmup_std text := 'Five minutes of easy cardio, then two or three lighter ramp-up sets of the first exercise (roughly 50%, 70% and 85% of your working weight). Add one ramp-up set for the first exercise of each new muscle group.';
  prog_beginner text := 'Double progression: start with a weight you could lift for two or three more reps than the bottom of the range. Add reps each session; once every set reaches the top of the range with good form, add the smallest weight step (about 2.5 kg upper body, 5 kg lower body) and work back up. Every 6 to 8 weeks, or after stalling twice in a row, take an easier week with half the sets.';
  prog_intermediate text := 'Main lifts: when every set hits the top of the rep range, add 2.5 kg (presses, rows) or 5 kg (squats, deadlifts). Accessories use double progression: add reps first, then weight. Stop most sets one or two reps short of failure. Deload every 6 to 8 weeks or after two stalled sessions on a lift: one week at half the sets and about 10% lighter.';
  prog_advanced text := 'Heavy work (3 to 6 reps): add the smallest weight step when all sets are completed with a rep in reserve; if you miss twice, drop 10% and build back up. Volume work: double progression, taking the last set of each exercise close to failure. Plan a deload week every 5 to 6 weeks: half the sets, same exercises, about 10% lighter.';
  spec jsonb := $json$
[
  {
    "slug": "three-day-strength-base-v2",
    "name": "3-Day Strength Base",
    "summary": "Three full-body sessions built around the big lifts, with enough accessory work to stay balanced.",
    "description": "Each session starts with a heavy compound lift and rotates the emphasis: squat and bench on day A, deadlift and overhead press on day B, front squat and hinge volume on day C. Rows, pulls and hamstring work balance the pressing so shoulders and lower back stay healthy.",
    "goal": "strength", "level": "intermediate", "weeks": 8, "split": "Full body",
    "equipment_note": "Full gym with barbells",
    "progression": "@intermediate",
    "recovery": "Leave a rest day between sessions, for example Monday, Wednesday and Friday. If deadlifts leave your lower back tired on day C, use a lighter Romanian deadlift.",
    "days": [
      { "name": "Day A", "focus": "Squat and bench press", "exercises": [
        ["Back Squat", 4, 4, 6, 180], ["Barbell Bench Press", 4, 4, 6, 150], ["Barbell Row", 3, 6, 8, 120],
        ["Lying Leg Curl", 3, 8, 10, 75], ["Hanging Leg Raise", 3, 8, 12, 60, "Alt: Lying Leg Raise"] ] },
      { "name": "Day B", "focus": "Deadlift and overhead press", "exercises": [
        ["Deadlift", 3, 3, 5, 180], ["Overhead Press", 4, 5, 7, 120], ["Pull-Up", 3, 5, 8, 120, "Alt: Lat Pulldown"],
        ["Walking Lunge", 2, 8, 10, 90], ["Face Pull", 3, 12, 15, 60] ] },
      { "name": "Day C", "focus": "Front squat, incline press, hinge", "exercises": [
        ["Front Squat", 3, 6, 8, 150, "Alt: Goblet Squat"], ["Incline Dumbbell Press", 3, 8, 10, 90],
        ["Chest-Supported Dumbbell Row", 3, 8, 10, 90], ["Romanian Deadlift", 3, 6, 8, 120],
        ["Triceps Pushdown", 2, 10, 12, 60], ["Dumbbell Curl", 2, 10, 12, 60] ] }
    ]
  },
  {
    "slug": "full-body-power-size",
    "name": "Full Body Power & Size",
    "summary": "Three full-body days that rotate heavy, volume and power work for strength and muscle together.",
    "description": "Daily undulating training for experienced lifters who can only train three times a week. The heavy day builds top-end strength, the volume day drives muscle growth with more sets in moderate rep ranges, and the power day trains speed and the deadlift. Each muscle is trained three times a week at different intensities, so recovery stays manageable.",
    "goal": "hybrid", "level": "advanced", "weeks": 8, "split": "Full body",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@advanced",
    "recovery": "Run the days in order with a rest day between each (Monday, Wednesday, Friday). Keep the power day crisp: stop each set while the bar is still moving fast.",
    "days": [
      { "name": "Heavy", "focus": "Squat, bench, weighted pull-up", "exercises": [
        ["Back Squat", 5, 3, 5, 180], ["Barbell Bench Press", 5, 3, 5, 180], ["Weighted Pull-Up", 4, 4, 6, 150, "Alt: Pull-Up or Lat Pulldown"],
        ["Romanian Deadlift", 3, 6, 8, 120], ["Standing Calf Raise", 3, 8, 12, 60] ] },
      { "name": "Volume", "focus": "Moderate weights, more sets", "exercises": [
        ["Hack Squat", 4, 8, 12, 120, "Alt: Leg Press"], ["Incline Dumbbell Press", 4, 8, 12, 90], ["Chest-Supported Dumbbell Row", 4, 10, 12, 90],
        ["Seated Leg Curl", 3, 10, 15, 60], ["Cable Lateral Raise", 3, 12, 20, 45],
        ["Incline Dumbbell Curl", 3, 10, 12, 60, "Superset with triceps to save time"], ["Overhead Cable Triceps Extension", 3, 10, 15, 60] ] },
      { "name": "Power", "focus": "Explosive pulls, deadlift, press", "exercises": [
        ["Power Clean", 5, 3, 3, 120, "Explosive and crisp. Alt: Jump Squat"], ["Deadlift", 4, 3, 5, 180], ["Overhead Press", 4, 5, 7, 120],
        ["Barbell Row", 4, 6, 8, 120], ["Walking Lunge", 3, 8, 10, 90], ["Hanging Leg Raise", 3, 10, 15, 60] ] }
    ]
  },
  {
    "slug": "upper-lower-power-hypertrophy",
    "name": "Upper / Lower Power & Size",
    "summary": "Four days: a heavy upper and lower day for strength, then a higher-volume pair for muscle.",
    "description": "A power-and-hypertrophy upper/lower split for advanced lifters. The first two days use low reps on the main lifts; the second two use more sets in moderate rep ranges with machines and cables for targeted growth. Every muscle is trained twice a week, once heavy and once for volume.",
    "goal": "hybrid", "level": "advanced", "weeks": 8, "split": "Upper / Lower",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@advanced",
    "recovery": "Upper Power, Lower Power, rest, Upper Size, Lower Size, then two rest days. Keep the deadlift on Lower Power submaximal; it follows heavy squats.",
    "days": [
      { "name": "Upper Power", "focus": "Heavy press and row", "exercises": [
        ["Barbell Bench Press", 4, 3, 5, 180], ["Pendlay Row", 4, 3, 5, 150, "Alt: Barbell Row"], ["Overhead Press", 3, 5, 8, 120],
        ["Weighted Pull-Up", 3, 5, 8, 120, "Alt: Pull-Up"], ["Skull Crusher", 2, 8, 10, 75], ["EZ-Bar Curl", 2, 8, 10, 75] ] },
      { "name": "Lower Power", "focus": "Heavy squat, lighter pull", "exercises": [
        ["Back Squat", 4, 3, 5, 180], ["Deadlift", 2, 3, 5, 180, "Leave two reps in reserve; it follows heavy squats"], ["Leg Press", 3, 8, 10, 120],
        ["Lying Leg Curl", 3, 6, 10, 75], ["Standing Calf Raise", 4, 6, 10, 60] ] },
      { "name": "Upper Size", "focus": "Volume for chest, back, shoulders, arms", "exercises": [
        ["Incline Dumbbell Press", 4, 8, 12, 90], ["Seated Cable Row", 4, 8, 12, 90], ["Cable Crossover", 3, 12, 15, 60],
        ["Lat Pulldown", 3, 10, 12, 75], ["Dumbbell Lateral Raise", 4, 12, 20, 45], ["Reverse Pec Deck", 3, 15, 20, 45, "Alt: Face Pull"],
        ["Incline Dumbbell Curl", 3, 10, 12, 60, "Superset with pushdowns"], ["Rope Pushdown", 3, 10, 15, 60] ] },
      { "name": "Lower Size", "focus": "Volume for quads, hamstrings, glutes", "exercises": [
        ["Hack Squat", 3, 8, 12, 120, "Alt: Leg Press"], ["Romanian Deadlift", 3, 8, 10, 120], ["Bulgarian Split Squat", 3, 10, 12, 90],
        ["Seated Leg Curl", 3, 10, 15, 60], ["Leg Extension", 3, 12, 15, 60], ["Seated Calf Raise", 4, 12, 15, 45] ] }
    ]
  },
  {
    "slug": "five-day-starter",
    "name": "5-Day Starter",
    "summary": "Five short sessions mixing upper, lower and full-body days for newer lifters.",
    "description": "For beginners who want to be in the gym most days. Sessions are short and the total weekly volume stays modest, so you can learn the movements and recover well. If five days ever feels like too much, the 3- or 4-day beginner plans give you the same results with fewer sessions.",
    "goal": "general_fitness", "level": "beginner", "weeks": 8, "split": "Upper / Lower + Full body",
    "equipment_note": "Gym with machines, cables and dumbbells",
    "progression": "@beginner",
    "recovery": "Train Monday, Tuesday, Thursday, Friday and Saturday, or any five days with the full-body day in the middle. Mild soreness is normal in the first two weeks.",
    "days": [
      { "name": "Upper A", "focus": "Machine press, pulldown", "exercises": [
        ["Machine Chest Press", 3, 8, 12, 90, "Alt: Dumbbell Bench Press"], ["Lat Pulldown", 3, 8, 12, 90], ["Seated Dumbbell Shoulder Press", 2, 10, 12, 75],
        ["Dumbbell Curl", 2, 10, 12, 60] ] },
      { "name": "Lower A", "focus": "Squat and hinge basics", "exercises": [
        ["Goblet Squat", 3, 8, 12, 90], ["Dumbbell Romanian Deadlift", 3, 8, 12, 90], ["Standing Calf Raise", 2, 12, 15, 45],
        ["Plank", 3, 20, 40, 45] ] },
      { "name": "Full Body", "focus": "Leg press, bench, row", "exercises": [
        ["Leg Press", 3, 10, 12, 90], ["Dumbbell Bench Press", 3, 8, 12, 90], ["Seated Cable Row", 3, 10, 12, 75],
        ["Glute Bridge", 2, 12, 15, 60], ["Dead Bug", 2, 8, 10, 45] ] },
      { "name": "Upper B", "focus": "Incline press, row, shoulders", "exercises": [
        ["Incline Dumbbell Press", 3, 8, 12, 90], ["One-Arm Dumbbell Row", 3, 8, 12, 75], ["Dumbbell Lateral Raise", 2, 12, 15, 45],
        ["Triceps Pushdown", 2, 10, 12, 60], ["Face Pull", 2, 12, 15, 45] ] },
      { "name": "Lower B", "focus": "Lunge, curls, extensions", "exercises": [
        ["Reverse Lunge", 3, 8, 10, 90], ["Lying Leg Curl", 3, 10, 12, 60], ["Leg Extension", 2, 12, 15, 60],
        ["Seated Calf Raise", 2, 12, 15, 45], ["Bird Dog", 2, 8, 10, 45] ] }
    ]
  },
  {
    "slug": "ppl-upper-lower",
    "name": "PPL + Upper / Lower",
    "summary": "Push, pull and legs, a rest day, then upper and lower: every muscle twice a week in five sessions.",
    "description": "A five-day hybrid for intermediates. The push, pull and legs days give each muscle group focused volume; the upper and lower days hit everything a second time with different exercises. Squats lead the legs day and deadlifts lead the lower day, two days apart.",
    "goal": "muscle", "level": "intermediate", "weeks": 8, "split": "PPL + Upper / Lower",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@intermediate",
    "recovery": "Push, Pull, Legs, rest, Upper, Lower, rest. If you need to move a day, keep the rest day after legs.",
    "days": [
      { "name": "Push", "focus": "Chest, shoulders, triceps", "exercises": [
        ["Barbell Bench Press", 4, 6, 8, 150], ["Seated Dumbbell Shoulder Press", 3, 8, 10, 90], ["Cable Crossover", 3, 10, 15, 60, "Alt: Pec Deck"],
        ["Dumbbell Lateral Raise", 3, 12, 15, 45], ["Overhead Cable Triceps Extension", 3, 10, 12, 60] ] },
      { "name": "Pull", "focus": "Back, rear delts, biceps", "exercises": [
        ["Pull-Up", 4, 6, 10, 120, "Alt: Lat Pulldown"], ["Barbell Row", 3, 6, 8, 120], ["Seated Cable Row", 3, 10, 12, 75],
        ["Face Pull", 3, 12, 15, 45], ["Incline Dumbbell Curl", 3, 10, 12, 60] ] },
      { "name": "Legs", "focus": "Squat-led", "exercises": [
        ["Back Squat", 4, 6, 8, 180], ["Romanian Deadlift", 3, 8, 10, 120], ["Leg Press", 3, 10, 12, 90],
        ["Seated Leg Curl", 3, 10, 12, 60], ["Standing Calf Raise", 4, 10, 15, 45] ] },
      { "name": "Upper", "focus": "Second upper-body session", "exercises": [
        ["Incline Dumbbell Press", 3, 8, 10, 90], ["Chest-Supported Dumbbell Row", 3, 8, 10, 90], ["Lat Pulldown", 3, 10, 12, 75],
        ["Machine Shoulder Press", 2, 10, 12, 75], ["Cable Lateral Raise", 2, 12, 15, 45],
        ["Hammer Curl", 2, 10, 12, 60, "Superset with pushdowns"], ["Rope Pushdown", 2, 10, 12, 60] ] },
      { "name": "Lower", "focus": "Deadlift-led", "exercises": [
        ["Deadlift", 3, 4, 6, 180], ["Bulgarian Split Squat", 3, 8, 10, 90], ["Barbell Hip Thrust", 3, 8, 12, 90, "Alt: Glute Bridge"],
        ["Lying Leg Curl", 3, 10, 12, 60], ["Leg Extension", 2, 12, 15, 60], ["Seated Calf Raise", 3, 12, 15, 45] ] }
    ]
  },
  {
    "slug": "classic-bodybuilding-split",
    "name": "Classic Body-Part Split",
    "summary": "Five days, one major muscle group each, with the high per-session volume bodybuilders use.",
    "description": "The traditional body-part split: chest, back, shoulders, legs and arms on separate days. Each muscle gets a long, focused session once a week, with hamstrings and abs also worked a second time. Best for experienced lifters who enjoy high-volume sessions and can recover from them.",
    "goal": "muscle", "level": "advanced", "weeks": 8, "split": "Body-part split",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@advanced",
    "recovery": "Chest, Back, Shoulders, Legs, Arms, then two rest days. Shoulders sit between back and legs so deadlifts and squats are two days apart.",
    "days": [
      { "name": "Chest", "focus": "Flat, incline, fly", "exercises": [
        ["Barbell Bench Press", 4, 6, 8, 150], ["Incline Dumbbell Press", 4, 8, 10, 90], ["Machine Chest Press", 3, 10, 12, 75],
        ["Cable Crossover", 3, 12, 15, 60], ["Chest Dip", 2, 8, 12, 90, "Alt: Decline Push-Up"] ] },
      { "name": "Back", "focus": "Deadlift, vertical and horizontal pulls", "exercises": [
        ["Deadlift", 3, 4, 6, 180], ["Weighted Pull-Up", 4, 6, 8, 120, "Alt: Lat Pulldown"], ["Barbell Row", 3, 8, 10, 120],
        ["Seated Cable Row", 3, 10, 12, 75], ["Straight-Arm Pulldown", 2, 12, 15, 60], ["Lying Leg Curl", 3, 10, 12, 60] ] },
      { "name": "Shoulders", "focus": "Press, side and rear delts", "exercises": [
        ["Overhead Press", 4, 6, 8, 120], ["Arnold Press", 3, 8, 10, 90], ["Cable Lateral Raise", 4, 12, 15, 45],
        ["Reverse Pec Deck", 4, 12, 15, 45], ["Dumbbell Shrug", 3, 10, 12, 60], ["Cable Crunch", 3, 10, 15, 45] ] },
      { "name": "Legs", "focus": "Quads, hamstrings, calves", "exercises": [
        ["Back Squat", 4, 6, 8, 180], ["Hack Squat", 3, 8, 12, 120, "Alt: Leg Press"], ["Romanian Deadlift", 3, 8, 10, 120],
        ["Walking Lunge", 2, 10, 12, 90], ["Leg Extension", 3, 12, 15, 60], ["Seated Leg Curl", 3, 10, 12, 60],
        ["Standing Calf Raise", 4, 10, 15, 45] ] },
      { "name": "Arms", "focus": "Biceps, triceps, abs", "exercises": [
        ["EZ-Bar Curl", 4, 8, 10, 75], ["Close-Grip Bench Press", 4, 6, 8, 120], ["Incline Dumbbell Curl", 3, 10, 12, 60],
        ["Overhead Cable Triceps Extension", 3, 10, 12, 60], ["Hammer Curl", 3, 10, 12, 60], ["Rope Pushdown", 3, 12, 15, 60],
        ["Hanging Leg Raise", 3, 10, 15, 60] ] }
    ]
  },
  {
    "slug": "ppl-starter",
    "name": "PPL Starter",
    "summary": "Six short push, pull and legs sessions with beginner-friendly volume.",
    "description": "For newer lifters who want to train six days a week. Each session has just three or four exercises, so the weekly workload stays similar to a 3-day plan, just spread out. Most beginners progress just as well on 3 or 4 days; choose this if daily training suits your routine.",
    "goal": "muscle", "level": "beginner", "weeks": 8, "split": "Push / Pull / Legs",
    "equipment_note": "Gym with machines, cables and dumbbells",
    "progression": "@beginner",
    "recovery": "Push, Pull, Legs, Push, Pull, Legs, rest. If you feel run down, take an extra rest day and pick up where you left off.",
    "days": [
      { "name": "Push A", "focus": "Chest, shoulders, triceps", "exercises": [
        ["Machine Chest Press", 3, 8, 12, 90], ["Seated Dumbbell Shoulder Press", 2, 8, 12, 90], ["Triceps Pushdown", 2, 10, 12, 60] ] },
      { "name": "Pull A", "focus": "Back and biceps", "exercises": [
        ["Lat Pulldown", 3, 8, 12, 90], ["Seated Cable Row", 2, 10, 12, 75], ["Dumbbell Curl", 2, 10, 12, 60] ] },
      { "name": "Legs A", "focus": "Squat and hinge", "exercises": [
        ["Goblet Squat", 3, 8, 12, 90], ["Dumbbell Romanian Deadlift", 3, 8, 12, 90], ["Standing Calf Raise", 2, 12, 15, 45], ["Plank", 2, 20, 40, 45] ] },
      { "name": "Push B", "focus": "Dumbbell press, side delts", "exercises": [
        ["Dumbbell Bench Press", 3, 8, 12, 90], ["Dumbbell Lateral Raise", 2, 12, 15, 45], ["Dumbbell Overhead Triceps Extension", 2, 10, 12, 60] ] },
      { "name": "Pull B", "focus": "Rows and rear delts", "exercises": [
        ["One-Arm Dumbbell Row", 3, 8, 12, 75], ["Face Pull", 2, 12, 15, 45], ["Hammer Curl", 2, 10, 12, 60] ] },
      { "name": "Legs B", "focus": "Leg press, hamstrings, glutes", "exercises": [
        ["Leg Press", 3, 10, 12, 90], ["Lying Leg Curl", 2, 10, 12, 60], ["Glute Bridge", 2, 12, 15, 60], ["Dead Bug", 2, 8, 10, 45] ] }
    ]
  },
  {
    "slug": "ppl-hypertrophy",
    "name": "PPL Hypertrophy",
    "summary": "Push, pull and legs twice a week with moderate volume for steady muscle growth.",
    "description": "A six-day push/pull/legs plan for intermediates. Each muscle is trained twice a week with about 10 to 14 hard sets, a range most lifters grow well on without burning out. A days lead with barbell lifts; B days use dumbbells, machines and cables for variety.",
    "goal": "muscle", "level": "intermediate", "weeks": 8, "split": "Push / Pull / Legs",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@intermediate",
    "recovery": "Push A, Pull A, Legs A, Push B, Pull B, Legs B, rest. Squats lead Legs A and hip thrusts lead Legs B, so there's no heavy hinge the day after a pull day.",
    "days": [
      { "name": "Push A", "focus": "Bench press", "exercises": [
        ["Barbell Bench Press", 3, 6, 8, 150], ["Seated Dumbbell Shoulder Press", 3, 8, 10, 90], ["Cable Crossover", 2, 12, 15, 60],
        ["Dumbbell Lateral Raise", 3, 12, 15, 45], ["Triceps Pushdown", 3, 10, 12, 60] ] },
      { "name": "Pull A", "focus": "Rows", "exercises": [
        ["Barbell Row", 3, 6, 8, 120], ["Lat Pulldown", 3, 8, 10, 90], ["Face Pull", 2, 12, 15, 45],
        ["Incline Dumbbell Curl", 3, 10, 12, 60], ["Hammer Curl", 2, 10, 12, 60] ] },
      { "name": "Legs A", "focus": "Squat", "exercises": [
        ["Back Squat", 3, 6, 8, 180], ["Romanian Deadlift", 3, 8, 10, 120], ["Leg Extension", 2, 12, 15, 60],
        ["Seated Leg Curl", 2, 10, 12, 60], ["Standing Calf Raise", 3, 10, 15, 45] ] },
      { "name": "Push B", "focus": "Incline press", "exercises": [
        ["Incline Dumbbell Press", 3, 8, 10, 90], ["Machine Shoulder Press", 2, 10, 12, 75], ["Pec Deck", 2, 12, 15, 60],
        ["Cable Lateral Raise", 3, 12, 15, 45], ["Overhead Cable Triceps Extension", 3, 10, 12, 60] ] },
      { "name": "Pull B", "focus": "Vertical pulls", "exercises": [
        ["Pull-Up", 3, 6, 10, 120, "Alt: Lat Pulldown"], ["Chest-Supported Dumbbell Row", 3, 8, 10, 90], ["Straight-Arm Pulldown", 2, 12, 15, 60],
        ["Reverse Pec Deck", 2, 15, 20, 45], ["Cable Curl", 3, 10, 12, 60] ] },
      { "name": "Legs B", "focus": "Glutes and single-leg", "exercises": [
        ["Hack Squat", 3, 8, 12, 120, "Alt: Leg Press"], ["Barbell Hip Thrust", 3, 8, 12, 90], ["Walking Lunge", 2, 10, 12, 90],
        ["Lying Leg Curl", 3, 10, 12, 60], ["Seated Calf Raise", 3, 12, 15, 45] ] }
    ]
  },
  {
    "slug": "push-pull-legs-v2",
    "name": "Push Pull Legs",
    "summary": "Six high-volume sessions a week for experienced lifters chasing maximum growth.",
    "description": "Push (chest, shoulders, triceps), pull (back, biceps) and legs, each twice a week with 16 to 20 hard sets per muscle. Legs A is squat-led and Legs B is deadlift-led, so you never deadlift the day before squatting. Demanding: make sure you can recover from six sessions before starting.",
    "goal": "muscle", "level": "advanced", "weeks": 6, "split": "Push / Pull / Legs",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@advanced",
    "recovery": "Push A, Pull A, Legs A, Push B, Pull B, Legs B, rest. Sleep and food matter more here than on any other plan; if performance drops for a week, deload.",
    "days": [
      { "name": "Push A", "focus": "Bench press", "exercises": [
        ["Barbell Bench Press", 4, 5, 7, 150], ["Overhead Press", 3, 6, 8, 120], ["Incline Dumbbell Press", 3, 8, 10, 90],
        ["Cable Lateral Raise", 4, 12, 15, 45], ["Triceps Pushdown", 3, 10, 12, 60], ["Overhead Cable Triceps Extension", 2, 12, 15, 60] ] },
      { "name": "Pull A", "focus": "Weighted pull-up and rows", "exercises": [
        ["Weighted Pull-Up", 4, 5, 8, 150, "Alt: Pull-Up"], ["Pendlay Row", 4, 6, 8, 120, "Alt: Barbell Row"], ["Seated Cable Row", 3, 10, 12, 75],
        ["Face Pull", 3, 15, 20, 45], ["Barbell Curl", 3, 8, 10, 60], ["Hammer Curl", 2, 10, 12, 60] ] },
      { "name": "Legs A", "focus": "Squat", "exercises": [
        ["Back Squat", 4, 5, 7, 180], ["Romanian Deadlift", 3, 8, 10, 120], ["Leg Press", 3, 10, 12, 90],
        ["Lying Leg Curl", 3, 10, 12, 60], ["Standing Calf Raise", 4, 10, 15, 45] ] },
      { "name": "Push B", "focus": "Incline press", "exercises": [
        ["Incline Barbell Bench Press", 4, 6, 8, 150], ["Seated Dumbbell Shoulder Press", 3, 8, 10, 90], ["Pec Deck", 3, 12, 15, 60],
        ["Dumbbell Lateral Raise", 4, 12, 20, 45], ["Skull Crusher", 3, 8, 12, 75], ["Rope Pushdown", 2, 12, 15, 60] ] },
      { "name": "Pull B", "focus": "Pulldowns and supported rows", "exercises": [
        ["Lat Pulldown", 4, 8, 12, 90], ["Chest-Supported Dumbbell Row", 4, 8, 12, 90], ["Straight-Arm Pulldown", 2, 12, 15, 60],
        ["Reverse Pec Deck", 3, 15, 20, 45], ["Incline Dumbbell Curl", 3, 10, 12, 60], ["Cable Curl", 2, 12, 15, 60] ] },
      { "name": "Legs B", "focus": "Deadlift", "exercises": [
        ["Deadlift", 3, 3, 5, 180], ["Front Squat", 3, 6, 8, 150, "Alt: Hack Squat"], ["Barbell Hip Thrust", 3, 8, 12, 90],
        ["Seated Leg Curl", 3, 10, 12, 60], ["Leg Extension", 3, 12, 15, 60], ["Seated Calf Raise", 4, 12, 15, 45] ] }
    ]
  },
  {
    "slug": "golden-era-split-classic",
    "name": "Golden Era Split: Classic",
    "summary": "An Arnold-style split at full volume: chest and back supersets, shoulders and arms, legs, twice a week.",
    "description": "Inspired by the classic high-volume split Arnold Schwarzenegger made famous: chest and back trained together with supersets, a shoulders-and-arms day and a legs day, each done twice a week with roughly 20 or more sets per muscle. This is a very demanding plan for experienced lifters; it isn't recommended for beginners. Gymly is not affiliated with or endorsed by Arnold Schwarzenegger.",
    "goal": "muscle", "level": "advanced", "weeks": 8, "split": "Arnold split",
    "featured": true, "tagline": "Golden era bodybuilding",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "Use double progression on every exercise and keep rest short (60 to 90 seconds; rest after both exercises of a superset). With this much volume, stop most sets one rep short of failure. Deload every 4 to 6 weeks: one week at half the sets.",
    "recovery": "Chest & Back, Shoulders & Arms, Legs, repeat, then rest. Shoulders are hit on back-to-back days (pressing on chest day, then the shoulder session), so warm them up well and drop a shoulder exercise if they ache. Eat and sleep for the volume.",
    "days": [
      { "name": "Chest & Back A", "focus": "Supersets: bench with pull-ups, incline with rows", "exercises": [
        ["Barbell Bench Press", 5, 6, 10, 90, "Superset with pull-ups; rest after both"], ["Pull-Up", 5, 6, 10, 90, "Alt: Lat Pulldown"],
        ["Incline Barbell Bench Press", 4, 6, 10, 90, "Superset with rows"], ["Barbell Row", 4, 8, 10, 90],
        ["Dumbbell Fly", 4, 10, 12, 60], ["Dumbbell Pullover", 3, 10, 12, 60], ["Crunch", 3, 15, 25, 45] ] },
      { "name": "Shoulders & Arms A", "focus": "Press, raises, curl and triceps supersets", "exercises": [
        ["Overhead Press", 4, 6, 10, 90], ["Dumbbell Lateral Raise", 4, 8, 12, 60], ["Rear Delt Fly", 4, 10, 12, 60],
        ["Barbell Curl", 4, 8, 10, 60, "Superset with close-grip bench"], ["Close-Grip Bench Press", 4, 8, 10, 60],
        ["Incline Dumbbell Curl", 3, 8, 10, 60, "Superset with skull crushers"], ["Skull Crusher", 3, 8, 10, 60], ["Wrist Curl", 3, 12, 15, 45] ] },
      { "name": "Legs A", "focus": "Squat, lunge, hamstrings, calves", "exercises": [
        ["Back Squat", 5, 8, 12, 150], ["Walking Lunge", 4, 10, 12, 90], ["Lying Leg Curl", 4, 10, 12, 60],
        ["Stiff-Leg Deadlift", 3, 8, 10, 90], ["Standing Calf Raise", 5, 10, 15, 45], ["Hanging Leg Raise", 3, 12, 20, 45] ] },
      { "name": "Chest & Back B", "focus": "Supersets: dumbbell presses with rows", "exercises": [
        ["Incline Dumbbell Press", 5, 8, 10, 90, "Superset with T-bar rows"], ["T-Bar Row", 5, 8, 10, 90, "Alt: Chest-Supported Dumbbell Row"],
        ["Dumbbell Bench Press", 4, 8, 10, 90, "Superset with one-arm rows"], ["One-Arm Dumbbell Row", 4, 8, 10, 90],
        ["Chest Dip", 3, 8, 12, 60, "Superset with pullovers"], ["Dumbbell Pullover", 3, 10, 12, 60], ["Cable Crunch", 3, 12, 15, 45] ] },
      { "name": "Shoulders & Arms B", "focus": "Arnold press, raises, curl and triceps supersets", "exercises": [
        ["Arnold Press", 4, 8, 10, 90], ["Cable Lateral Raise", 4, 10, 15, 60], ["Face Pull", 3, 12, 15, 60],
        ["Preacher Curl", 4, 8, 10, 60, "Superset with overhead extensions"], ["Overhead Cable Triceps Extension", 4, 10, 12, 60],
        ["Concentration Curl", 3, 10, 12, 60, "Superset with pushdowns"], ["Rope Pushdown", 3, 10, 12, 60], ["Reverse Wrist Curl", 3, 12, 15, 45] ] },
      { "name": "Legs B", "focus": "Front squat, leg press, isolation", "exercises": [
        ["Front Squat", 4, 8, 10, 150, "Alt: Hack Squat"], ["Leg Press", 4, 10, 15, 90], ["Leg Extension", 4, 12, 15, 60],
        ["Seated Leg Curl", 4, 10, 12, 60], ["Romanian Deadlift", 3, 8, 10, 90], ["Seated Calf Raise", 5, 12, 15, 45] ] }
    ]
  },
  {
    "slug": "golden-era-split-modified",
    "name": "Golden Era Split: Modified",
    "summary": "The Arnold-style split with manageable volume for intermediate lifters.",
    "description": "Keeps the classic structure (chest and back together, shoulders and arms, legs, each twice a week) but cuts the volume to about 12 to 16 sets per muscle and uses straight sets with longer rests on the big lifts. Supersets are optional. A good way to try golden-era training without the recovery cost of the full-volume version. Gymly is not affiliated with or endorsed by Arnold Schwarzenegger.",
    "goal": "muscle", "level": "intermediate", "weeks": 8, "split": "Arnold split",
    "featured": true, "tagline": "Golden era bodybuilding",
    "equipment_note": "Full gym with barbells, cables and machines",
    "progression": "@intermediate",
    "recovery": "Chest & Back, Shoulders & Arms, Legs, repeat, then rest. Shoulders work on back-to-back days, so keep a rep or two in reserve on presses. You can run it as three days on, one off if six in a row is too much.",
    "days": [
      { "name": "Chest & Back A", "focus": "Bench, pull-ups, incline, rows", "exercises": [
        ["Barbell Bench Press", 3, 6, 8, 120, "Optional: superset with pull-ups"], ["Pull-Up", 3, 6, 10, 120, "Alt: Lat Pulldown"],
        ["Incline Dumbbell Press", 3, 8, 10, 90], ["Barbell Row", 3, 8, 10, 90], ["Dumbbell Pullover", 2, 10, 12, 60] ] },
      { "name": "Shoulders & Arms A", "focus": "Press, raises, curls, triceps", "exercises": [
        ["Seated Dumbbell Shoulder Press", 3, 8, 10, 90], ["Dumbbell Lateral Raise", 3, 12, 15, 45], ["EZ-Bar Curl", 3, 8, 10, 60],
        ["Close-Grip Bench Press", 3, 8, 10, 90], ["Face Pull", 2, 12, 15, 45] ] },
      { "name": "Legs A", "focus": "Squat-led", "exercises": [
        ["Back Squat", 3, 6, 8, 180], ["Romanian Deadlift", 3, 8, 10, 120], ["Walking Lunge", 2, 10, 12, 90],
        ["Lying Leg Curl", 2, 10, 12, 60], ["Standing Calf Raise", 3, 10, 15, 45] ] },
      { "name": "Chest & Back B", "focus": "Incline barbell, supported rows, flyes", "exercises": [
        ["Incline Barbell Bench Press", 3, 8, 10, 120], ["Chest-Supported Dumbbell Row", 3, 8, 10, 90], ["Cable Crossover", 2, 12, 15, 60],
        ["Lat Pulldown", 3, 10, 12, 75], ["Hanging Leg Raise", 2, 10, 15, 45] ] },
      { "name": "Shoulders & Arms B", "focus": "Arnold press, cable raises, arms", "exercises": [
        ["Arnold Press", 3, 8, 10, 90], ["Cable Lateral Raise", 3, 12, 15, 45], ["Incline Dumbbell Curl", 3, 10, 12, 60],
        ["Overhead Cable Triceps Extension", 3, 10, 12, 60], ["Hammer Curl", 2, 10, 12, 60] ] },
      { "name": "Legs B", "focus": "Leg press and glutes", "exercises": [
        ["Leg Press", 3, 10, 12, 120], ["Barbell Hip Thrust", 3, 8, 12, 90], ["Leg Extension", 2, 12, 15, 60],
        ["Seated Leg Curl", 3, 10, 12, 60], ["Seated Calf Raise", 3, 12, 15, 45] ] }
    ]
  }
]
  $json$;
  p jsonb; d jsonb; x jsonb;
  v_program uuid; v_day uuid; v_ex uuid;
  v_day_pos smallint; v_ex_pos smallint;
  v_progression text;
begin
  for p in select * from jsonb_array_elements(spec) loop
    continue when exists (select 1 from public.programs where slug = p ->> 'slug');

    v_progression := case p ->> 'progression'
      when '@beginner' then prog_beginner when '@intermediate' then prog_intermediate when '@advanced' then prog_advanced
      else p ->> 'progression' end;

    insert into public.programs (
      slug, name, summary, description, goal, level, days_per_week, weeks, equipment_note,
      split, featured, tagline, warmup, progression, recovery
    ) values (
      p ->> 'slug', p ->> 'name', p ->> 'summary', p ->> 'description',
      (p ->> 'goal')::public.training_goal, (p ->> 'level')::public.experience_level,
      jsonb_array_length(p -> 'days'), (p ->> 'weeks')::smallint, p ->> 'equipment_note',
      p ->> 'split', coalesce((p ->> 'featured')::boolean, false), p ->> 'tagline',
      warmup_std, v_progression, p ->> 'recovery'
    ) returning id into v_program;

    v_day_pos := 0;
    for d in select * from jsonb_array_elements(p -> 'days') loop
      insert into public.program_days (program_id, position, name, focus)
      values (v_program, v_day_pos, d ->> 'name', d ->> 'focus') returning id into v_day;
      v_day_pos := v_day_pos + 1;

      v_ex_pos := 0;
      for x in select * from jsonb_array_elements(d -> 'exercises') loop
        select id into v_ex from public.exercises where owner_id is null and name = x ->> 0;
        if v_ex is null then
          raise exception 'Program "%": unknown exercise "%"', p ->> 'name', x ->> 0;
        end if;
        insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps_min, reps_max, rest_seconds, notes)
        values (v_day, v_ex, v_ex_pos, (x ->> 1)::smallint, (x ->> 2)::smallint, (x ->> 3)::smallint, (x ->> 4)::integer, x ->> 5);
        v_ex_pos := v_ex_pos + 1;
      end loop;
    end loop;
  end loop;

  -- Unchanged built-ins: add the new guidance without touching their structure.
  update public.programs set split = 'Full body', warmup = warmup_std, progression = prog_beginner,
    recovery = 'Leave at least one rest day between sessions, for example Monday, Wednesday and Friday.'
  where slug = 'foundations-full-body' and owner_id is null;
  update public.programs set split = 'Full body', warmup = 'Five minutes of brisk walking or marching on the spot, then a light set of the first two exercises.',
    progression = prog_beginner,
    recovery = 'Leave a rest day between sessions. When the top of the rep range feels easy and you have no heavier dumbbells, slow the lowering phase to three seconds.'
  where slug = 'home-dumbbell-builder' and owner_id is null;
  update public.programs set split = 'Upper / Lower', warmup = warmup_std, progression = prog_beginner,
    recovery = 'Upper, Lower, rest, Upper, Lower, then two rest days (for example Monday, Tuesday, Thursday, Friday).'
  where slug = 'four-day-foundations' and owner_id is null;
  update public.programs set split = 'Upper / Lower', warmup = warmup_std, progression = prog_intermediate,
    recovery = 'Upper A, Lower A, rest, Upper B, Lower B, then two rest days. Deadlifts on Lower B are three days after heavy squats.'
  where slug = 'upper-lower-strength' and owner_id is null;

  -- Replaced built-ins: hidden from the catalog; existing enrollments keep working unchanged.
  update public.programs set listed = false
  where owner_id is null and slug in ('three-day-strength-base', 'five-day-hybrid-split', 'five-day-muscle-builder', 'push-pull-legs');
end $$;
