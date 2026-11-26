-- More built-in programs so every common schedule (3, 4, 5 and 6 days/week) has options.
-- Same format and loader as 20261127120500_builtin_programs.sql: idempotent on slug; unknown exercise
-- names abort. Each day lists [exercise name, sets, reps_min, reps_max, rest_seconds] (seconds for timed).

do $$
declare
  spec jsonb := $json$
[
  {
    "slug": "three-day-strength-base",
    "name": "3-Day Strength Base",
    "summary": "Three sessions a week built around the big lifts, for steady strength gains.",
    "description": "Each session pairs a heavy squat or hinge with a heavy press, then adds back and core work. Keep two to three reps in reserve on accessories and add weight to the main lifts when you complete every set at the target reps.",
    "goal": "strength",
    "level": "intermediate",
    "weeks": 8,
    "equipment_note": "Full gym with barbells",
    "days": [
      {
        "name": "Day A",
        "focus": "Squat and bench",
        "exercises": [
          [
            "Back Squat",
            4,
            5,
            5,
            180
          ],
          [
            "Barbell Bench Press",
            4,
            5,
            5,
            150
          ],
          [
            "Barbell Row",
            3,
            6,
            8,
            120
          ],
          [
            "Hanging Leg Raise",
            3,
            10,
            10,
            60
          ]
        ]
      },
      {
        "name": "Day B",
        "focus": "Deadlift and overhead press",
        "exercises": [
          [
            "Deadlift",
            3,
            5,
            5,
            180
          ],
          [
            "Overhead Press",
            4,
            5,
            5,
            150
          ],
          [
            "Lat Pulldown",
            3,
            8,
            10,
            90
          ],
          [
            "Dumbbell Curl",
            2,
            10,
            12,
            60
          ],
          [
            "Plank",
            3,
            45,
            45,
            45
          ]
        ]
      },
      {
        "name": "Day C",
        "focus": "Volume day",
        "exercises": [
          [
            "Front Squat",
            3,
            6,
            8,
            150
          ],
          [
            "Incline Dumbbell Press",
            3,
            8,
            10,
            90
          ],
          [
            "Chest-Supported Dumbbell Row",
            3,
            10,
            10,
            90
          ],
          [
            "Romanian Deadlift",
            3,
            8,
            8,
            120
          ],
          [
            "Triceps Pushdown",
            2,
            12,
            12,
            60
          ]
        ]
      }
    ]
  },
  {
    "slug": "four-day-foundations",
    "name": "4-Day Foundations",
    "summary": "Four shorter sessions a week using machines and dumbbells, ideal for building a base.",
    "description": "Alternates upper- and lower-body days with beginner-friendly equipment, so each session is focused and manageable. Use weights that leave two reps in reserve and add a little load once you reach the top of each rep range.",
    "goal": "general_fitness",
    "level": "beginner",
    "weeks": 8,
    "equipment_note": "Gym with machines, cables and dumbbells",
    "days": [
      {
        "name": "Upper A",
        "focus": "Press and pull",
        "exercises": [
          [
            "Machine Chest Press",
            3,
            8,
            10,
            90
          ],
          [
            "Lat Pulldown",
            3,
            10,
            12,
            75
          ],
          [
            "Seated Dumbbell Shoulder Press",
            3,
            10,
            10,
            75
          ],
          [
            "Seated Cable Row",
            3,
            10,
            12,
            75
          ],
          [
            "Dumbbell Curl",
            2,
            12,
            12,
            45
          ]
        ]
      },
      {
        "name": "Lower A",
        "focus": "Squat and hinge",
        "exercises": [
          [
            "Goblet Squat",
            3,
            10,
            10,
            90
          ],
          [
            "Dumbbell Romanian Deadlift",
            3,
            10,
            10,
            90
          ],
          [
            "Leg Extension",
            2,
            12,
            15,
            60
          ],
          [
            "Seated Leg Curl",
            2,
            12,
            15,
            60
          ],
          [
            "Plank",
            3,
            30,
            45,
            45
          ]
        ]
      },
      {
        "name": "Upper B",
        "focus": "Dumbbells and shoulders",
        "exercises": [
          [
            "Dumbbell Bench Press",
            3,
            8,
            10,
            90
          ],
          [
            "One-Arm Dumbbell Row",
            3,
            10,
            10,
            75
          ],
          [
            "Dumbbell Lateral Raise",
            3,
            12,
            15,
            45
          ],
          [
            "Triceps Pushdown",
            2,
            12,
            12,
            45
          ],
          [
            "Face Pull",
            2,
            15,
            15,
            45
          ]
        ]
      },
      {
        "name": "Lower B",
        "focus": "Legs and core",
        "exercises": [
          [
            "Leg Press",
            3,
            10,
            12,
            90
          ],
          [
            "Glute Bridge",
            3,
            12,
            12,
            60
          ],
          [
            "Reverse Lunge",
            2,
            10,
            10,
            75
          ],
          [
            "Standing Calf Raise",
            3,
            12,
            12,
            45
          ],
          [
            "Dead Bug",
            3,
            10,
            10,
            45
          ]
        ]
      }
    ]
  },
  {
    "slug": "five-day-hybrid-split",
    "name": "5-Day Hybrid Split",
    "summary": "Upper, lower, push, pull and legs: strength early in the week, size later.",
    "description": "The first two sessions focus on heavier compound work; the last three add volume with a push/pull/legs split, so every muscle is trained about twice a week. Take a rest day after the lower session if you need it.",
    "goal": "muscle",
    "level": "intermediate",
    "weeks": 8,
    "equipment_note": "Full gym with barbells, cables and machines",
    "days": [
      {
        "name": "Upper",
        "focus": "Heavy press and row",
        "exercises": [
          [
            "Barbell Bench Press",
            4,
            6,
            6,
            150
          ],
          [
            "Barbell Row",
            4,
            6,
            8,
            120
          ],
          [
            "Overhead Press",
            3,
            8,
            8,
            120
          ],
          [
            "Lat Pulldown",
            3,
            10,
            10,
            90
          ],
          [
            "Barbell Curl",
            2,
            10,
            10,
            60
          ]
        ]
      },
      {
        "name": "Lower",
        "focus": "Heavy squat",
        "exercises": [
          [
            "Back Squat",
            4,
            6,
            6,
            180
          ],
          [
            "Romanian Deadlift",
            3,
            8,
            8,
            120
          ],
          [
            "Walking Lunge",
            3,
            10,
            10,
            90
          ],
          [
            "Lying Leg Curl",
            3,
            10,
            10,
            75
          ],
          [
            "Standing Calf Raise",
            3,
            12,
            12,
            60
          ]
        ]
      },
      {
        "name": "Push",
        "focus": "Chest, shoulders, triceps",
        "exercises": [
          [
            "Incline Dumbbell Press",
            4,
            8,
            10,
            90
          ],
          [
            "Seated Dumbbell Shoulder Press",
            3,
            10,
            10,
            90
          ],
          [
            "Cable Crossover",
            3,
            12,
            15,
            60
          ],
          [
            "Cable Lateral Raise",
            3,
            15,
            15,
            45
          ],
          [
            "Rope Pushdown",
            3,
            12,
            12,
            60
          ]
        ]
      },
      {
        "name": "Pull",
        "focus": "Back and biceps",
        "exercises": [
          [
            "Pull-Up",
            4,
            6,
            10,
            120
          ],
          [
            "Chest-Supported Dumbbell Row",
            3,
            10,
            10,
            90
          ],
          [
            "Seated Cable Row",
            3,
            12,
            12,
            75
          ],
          [
            "Face Pull",
            3,
            15,
            15,
            60
          ],
          [
            "Hammer Curl",
            3,
            12,
            12,
            60
          ]
        ]
      },
      {
        "name": "Legs",
        "focus": "Front squat and glutes",
        "exercises": [
          [
            "Front Squat",
            3,
            8,
            8,
            150
          ],
          [
            "Barbell Hip Thrust",
            3,
            10,
            10,
            120
          ],
          [
            "Leg Press",
            3,
            12,
            12,
            90
          ],
          [
            "Seated Leg Curl",
            3,
            12,
            12,
            75
          ],
          [
            "Seated Calf Raise",
            3,
            15,
            15,
            60
          ]
        ]
      }
    ]
  },
  {
    "slug": "five-day-muscle-builder",
    "name": "5-Day Muscle Builder",
    "summary": "A body-part split with one focused session per muscle group each week.",
    "description": "Each day hammers one or two muscle groups with plenty of volume, finishing with an arms and conditioning day. Push each set close to failure with good form, and add reps before adding weight.",
    "goal": "muscle",
    "level": "intermediate",
    "weeks": 6,
    "equipment_note": "Full gym with barbells, cables and machines",
    "days": [
      {
        "name": "Chest & Triceps",
        "focus": "Pressing volume",
        "exercises": [
          [
            "Barbell Bench Press",
            4,
            8,
            8,
            120
          ],
          [
            "Incline Dumbbell Press",
            3,
            10,
            10,
            90
          ],
          [
            "Pec Deck",
            3,
            12,
            15,
            60
          ],
          [
            "Close-Grip Bench Press",
            3,
            8,
            10,
            90
          ],
          [
            "Overhead Cable Triceps Extension",
            3,
            12,
            12,
            60
          ]
        ]
      },
      {
        "name": "Back & Biceps",
        "focus": "Pulling volume",
        "exercises": [
          [
            "Deadlift",
            3,
            5,
            5,
            180
          ],
          [
            "Lat Pulldown",
            4,
            10,
            10,
            90
          ],
          [
            "Seated Cable Row",
            3,
            10,
            12,
            75
          ],
          [
            "Straight-Arm Pulldown",
            3,
            12,
            15,
            60
          ],
          [
            "EZ-Bar Curl",
            3,
            10,
            10,
            60
          ]
        ]
      },
      {
        "name": "Legs",
        "focus": "Quads, hamstrings, calves",
        "exercises": [
          [
            "Back Squat",
            4,
            8,
            8,
            180
          ],
          [
            "Leg Press",
            3,
            12,
            12,
            90
          ],
          [
            "Romanian Deadlift",
            3,
            10,
            10,
            120
          ],
          [
            "Leg Extension",
            3,
            15,
            15,
            60
          ],
          [
            "Seated Calf Raise",
            4,
            15,
            15,
            45
          ]
        ]
      },
      {
        "name": "Shoulders & Core",
        "focus": "Delts, traps, abs",
        "exercises": [
          [
            "Overhead Press",
            4,
            6,
            8,
            120
          ],
          [
            "Cable Lateral Raise",
            4,
            12,
            15,
            45
          ],
          [
            "Reverse Pec Deck",
            3,
            15,
            15,
            45
          ],
          [
            "Barbell Shrug",
            3,
            12,
            12,
            60
          ],
          [
            "Cable Crunch",
            3,
            12,
            15,
            45
          ]
        ]
      },
      {
        "name": "Arms & Conditioning",
        "focus": "Biceps, triceps, engine",
        "exercises": [
          [
            "Incline Dumbbell Curl",
            3,
            10,
            12,
            60
          ],
          [
            "Skull Crusher",
            3,
            10,
            10,
            60
          ],
          [
            "Hammer Curl",
            3,
            12,
            12,
            45
          ],
          [
            "Triceps Dip",
            3,
            8,
            12,
            60
          ],
          [
            "Rowing Machine",
            1,
            600,
            600,
            0
          ]
        ]
      }
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
