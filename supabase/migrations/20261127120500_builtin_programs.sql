-- Built-in programs (original content). Idempotent on slug.
-- Each day lists [exercise name, sets, reps_min, reps_max, rest_seconds]; for duration exercises
-- reps are seconds. Unknown exercise names abort the migration so typos can't slip through.

do $$
declare
  spec jsonb := $json$
  [
    {
      "slug": "foundations-full-body",
      "name": "Foundations Full Body",
      "summary": "Three full-body sessions a week to build technique, strength and a habit.",
      "description": "Every session trains your whole body with simple, effective movements. Start light enough to finish every set with good form, then add a little weight whenever you hit the top of the rep range on all sets. Rest at least a day between sessions.",
      "goal": "general_fitness", "level": "beginner", "weeks": 8,
      "equipment_note": "Gym with dumbbells, cables and machines",
      "days": [
        { "name": "Full Body A", "focus": "Squat, press, row", "exercises": [
          ["Goblet Squat", 3, 8, 10, 90], ["Dumbbell Bench Press", 3, 8, 10, 90], ["Seated Cable Row", 3, 10, 12, 75],
          ["Dumbbell Romanian Deadlift", 3, 10, 10, 90], ["Plank", 3, 30, 45, 45] ] },
        { "name": "Full Body B", "focus": "Legs, overhead press, pull-down", "exercises": [
          ["Leg Press", 3, 10, 12, 90], ["Seated Dumbbell Shoulder Press", 3, 8, 10, 90], ["Lat Pulldown", 3, 10, 12, 75],
          ["Glute Bridge", 3, 12, 15, 60], ["Dead Bug", 3, 10, 10, 45] ] },
        { "name": "Full Body C", "focus": "Single-leg, incline press, row", "exercises": [
          ["Bulgarian Split Squat", 3, 8, 10, 90], ["Incline Dumbbell Press", 3, 8, 10, 90], ["One-Arm Dumbbell Row", 3, 10, 10, 75],
          ["Lying Leg Curl", 3, 10, 12, 60], ["Hanging Knee Raise", 3, 10, 12, 45] ] }
      ]
    },
    {
      "slug": "upper-lower-strength",
      "name": "Upper / Lower Strength",
      "summary": "Four days a week: heavy compound lifts plus volume work for size.",
      "description": "Alternates upper- and lower-body days. The A days focus on heavier, lower-rep work on the main lifts; the B days add volume for muscle growth. Add weight to the main lifts when every set reaches the target reps with good form.",
      "goal": "strength", "level": "intermediate", "weeks": 8,
      "equipment_note": "Full gym with barbells",
      "days": [
        { "name": "Upper A", "focus": "Heavy press and row", "exercises": [
          ["Barbell Bench Press", 4, 5, 5, 150], ["Barbell Row", 4, 6, 6, 120], ["Overhead Press", 3, 6, 8, 120],
          ["Lat Pulldown", 3, 8, 10, 90], ["Barbell Curl", 2, 10, 10, 60], ["Triceps Pushdown", 2, 10, 12, 60] ] },
        { "name": "Lower A", "focus": "Heavy squat", "exercises": [
          ["Back Squat", 4, 5, 5, 180], ["Romanian Deadlift", 3, 6, 8, 120], ["Leg Press", 3, 10, 10, 90],
          ["Lying Leg Curl", 3, 10, 10, 75], ["Standing Calf Raise", 3, 10, 12, 60] ] },
        { "name": "Upper B", "focus": "Upper-body volume", "exercises": [
          ["Incline Dumbbell Press", 4, 8, 10, 90], ["Chest-Supported Dumbbell Row", 4, 10, 10, 90], ["Seated Dumbbell Shoulder Press", 3, 10, 10, 90],
          ["Pull-Up", 3, 6, 10, 120], ["Dumbbell Lateral Raise", 3, 12, 15, 60], ["Hammer Curl", 2, 12, 12, 60] ] },
        { "name": "Lower B", "focus": "Heavy hinge, single-leg work", "exercises": [
          ["Deadlift", 3, 5, 5, 180], ["Front Squat", 3, 6, 8, 120], ["Walking Lunge", 3, 10, 10, 90],
          ["Seated Leg Curl", 3, 12, 12, 75], ["Seated Calf Raise", 3, 12, 15, 60], ["Hanging Leg Raise", 3, 10, 10, 60] ] }
      ]
    },
    {
      "slug": "push-pull-legs",
      "name": "Push Pull Legs",
      "summary": "Six focused sessions a week for lifters who want maximum volume.",
      "description": "Each muscle group is trained twice a week across push (chest, shoulders, triceps), pull (back, biceps) and legs days. Demanding: make sure you can recover from six sessions before starting. Progress the first lift of each day first.",
      "goal": "muscle", "level": "advanced", "weeks": 6,
      "equipment_note": "Full gym with barbells, cables and machines",
      "days": [
        { "name": "Push A", "focus": "Bench press", "exercises": [
          ["Barbell Bench Press", 4, 6, 8, 150], ["Overhead Press", 3, 8, 8, 120], ["Incline Dumbbell Press", 3, 10, 10, 90],
          ["Cable Lateral Raise", 3, 12, 15, 60], ["Triceps Pushdown", 3, 10, 12, 60], ["Overhead Cable Triceps Extension", 2, 12, 12, 60] ] },
        { "name": "Pull A", "focus": "Deadlift", "exercises": [
          ["Deadlift", 3, 5, 5, 180], ["Pull-Up", 3, 6, 10, 120], ["Barbell Row", 3, 8, 8, 90],
          ["Face Pull", 3, 15, 15, 60], ["Barbell Curl", 3, 10, 10, 60], ["Hammer Curl", 2, 12, 12, 60] ] },
        { "name": "Legs A", "focus": "Squat", "exercises": [
          ["Back Squat", 4, 6, 8, 180], ["Romanian Deadlift", 3, 8, 10, 120], ["Leg Press", 3, 10, 12, 90],
          ["Lying Leg Curl", 3, 12, 12, 75], ["Standing Calf Raise", 4, 10, 15, 60] ] },
        { "name": "Push B", "focus": "Incline press", "exercises": [
          ["Incline Barbell Bench Press", 4, 8, 8, 120], ["Seated Dumbbell Shoulder Press", 3, 10, 10, 90], ["Machine Chest Press", 3, 10, 12, 90],
          ["Dumbbell Lateral Raise", 4, 12, 15, 60], ["Skull Crusher", 3, 10, 10, 75], ["Rope Pushdown", 2, 12, 15, 60] ] },
        { "name": "Pull B", "focus": "Rows and pulldowns", "exercises": [
          ["Lat Pulldown", 4, 8, 10, 90], ["Chest-Supported Dumbbell Row", 3, 10, 10, 90], ["Seated Cable Row", 3, 10, 12, 75],
          ["Reverse Pec Deck", 3, 15, 15, 60], ["Incline Dumbbell Curl", 3, 10, 12, 60], ["Cable Curl", 2, 12, 12, 60] ] },
        { "name": "Legs B", "focus": "Front squat and glutes", "exercises": [
          ["Front Squat", 3, 8, 8, 150], ["Barbell Hip Thrust", 3, 8, 10, 120], ["Bulgarian Split Squat", 3, 10, 10, 90],
          ["Seated Leg Curl", 3, 12, 12, 75], ["Leg Extension", 3, 12, 15, 60], ["Seated Calf Raise", 3, 15, 15, 60] ] }
      ]
    },
    {
      "slug": "home-dumbbell-builder",
      "name": "Home Dumbbell Builder",
      "summary": "Three sessions a week with just a pair of dumbbells and a bench or floor.",
      "description": "Built for home training with adjustable or fixed dumbbells. Slow the lowering phase and keep rest short to make lighter weights count. When all sets hit the top of the range, move to the next dumbbell or add reps.",
      "goal": "muscle", "level": "beginner", "weeks": 6,
      "equipment_note": "Dumbbells, optional bench",
      "days": [
        { "name": "Day A", "focus": "Squat, press, row", "exercises": [
          ["Goblet Squat", 3, 10, 12, 75], ["Dumbbell Bench Press", 3, 10, 10, 75], ["One-Arm Dumbbell Row", 3, 10, 10, 60],
          ["Dumbbell Romanian Deadlift", 3, 10, 10, 75], ["Plank", 3, 40, 40, 45] ] },
        { "name": "Day B", "focus": "Lunge, overhead press, push-ups", "exercises": [
          ["Reverse Lunge", 3, 10, 10, 75], ["Seated Dumbbell Shoulder Press", 3, 10, 10, 75], ["Push-Up", 3, 8, 15, 60],
          ["Chest-Supported Dumbbell Row", 3, 12, 12, 60], ["Glute Bridge", 3, 15, 15, 45] ] },
        { "name": "Day C", "focus": "Single-leg and arms", "exercises": [
          ["Bulgarian Split Squat", 3, 8, 8, 75], ["Incline Dumbbell Press", 3, 10, 10, 75], ["Dumbbell Curl", 3, 12, 12, 45],
          ["Dumbbell Overhead Triceps Extension", 3, 12, 12, 45], ["Russian Twist", 3, 16, 16, 45] ] }
      ]
    }
  ]
  $json$;
  p jsonb; d jsonb; x jsonb;
  v_program uuid; v_day uuid; v_ex uuid;
  v_day_pos smallint; v_ex_pos smallint;
begin
  for p in select * from jsonb_array_elements(spec) loop
    continue when exists (select 1 from public.programs where slug = p ->> 'slug');

    insert into public.programs (slug, name, summary, description, goal, level, days_per_week, weeks, equipment_note)
    values (p ->> 'slug', p ->> 'name', p ->> 'summary', p ->> 'description',
            (p ->> 'goal')::public.training_goal, (p ->> 'level')::public.experience_level,
            jsonb_array_length(p -> 'days'), (p ->> 'weeks')::smallint, p ->> 'equipment_note')
    returning id into v_program;

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
        insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps_min, reps_max, rest_seconds)
        values (v_day, v_ex, v_ex_pos, (x ->> 1)::smallint, (x ->> 2)::smallint, (x ->> 3)::smallint, (x ->> 4)::integer);
        v_ex_pos := v_ex_pos + 1;
      end loop;
    end loop;
  end loop;
end $$;
