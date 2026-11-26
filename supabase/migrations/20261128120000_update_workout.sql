-- Edit a saved workout: rename, change notes, and replace its exercises/sets in one transaction.
-- Date/time, template and program linkage are kept. Stats, PRs and charts are derived from sets,
-- so they update automatically. Security invoker: RLS limits this to the caller's own workouts.

create function public.update_workout(payload jsonb) returns uuid
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

  update public.workouts
  set name = coalesce(nullif(trim(payload ->> 'name'), ''), 'Workout'),
      notes = nullif(payload ->> 'notes', '')
  where id = v_workout_id and user_id = (select auth.uid());
  if not found then raise exception 'workout not found' using errcode = 'P0002'; end if;

  delete from public.workout_exercises where workout_id = v_workout_id; -- sets cascade

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

revoke execute on function public.update_workout(jsonb) from public, anon;
grant execute on function public.update_workout(jsonb) to authenticated;
