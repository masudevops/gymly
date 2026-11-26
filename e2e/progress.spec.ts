import { expect, test } from '@playwright/test';

import { addExercises, autoAcceptDialogs, collectErrors, input, signUp, sql, tap, visibleText } from './helpers';

test('progress: PRs, streak, exercise chart and body weight', async ({ page }) => {
  autoAcceptDialogs(page);
  const errors = collectErrors(page);
  const email = await signUp(page, 'progress');

  // Seed 4 weekly bench sessions (80 → 90 kg) and body weight, as if the user had history.
  sql(`do $$ declare u uuid := (select id from auth.users where email = '${email}');
    b uuid := (select id from public.exercises where owner_id is null and name = 'Barbell Bench Press'); w uuid; we uuid; i int;
  begin
    for i in 1..4 loop
      insert into public.workouts (user_id, name, started_at, finished_at)
        values (u, 'Session ' || i, now() - make_interval(days => 7 * (5 - i)), now() - make_interval(days => 7 * (5 - i)) + interval '1 hour') returning id into w;
      insert into public.workout_exercises (workout_id, exercise_id, position) values (w, b, 0) returning id into we;
      insert into public.workout_sets (workout_exercise_id, position, weight_kg, reps) values (we, 0, 80 + 2.5 * i, 5), (we, 1, 80 + 2.5 * i, 5);
    end loop;
    insert into public.body_measurements (user_id, measured_on, weight_kg) values (u, current_date - 14, 84.0), (u, current_date - 7, 83.2);
  end $$;`);

  await page.reload();
  await tap(page, 'Start empty workout');
  await addExercises(page, ['Barbell Bench Press']);
  await expect(visibleText(page, '90×5', false).first()).toBeVisible(); // last session as "previous"
  await page.getByLabel('Set 1 weight').first().fill('95');
  await page.getByLabel('Set 1 reps').first().fill('5');
  await page.getByLabel('Complete set 1').first().click();
  await visibleText(page, 'Finish').first().click();

  await expect(visibleText(page, /2 new personal records/)).toBeVisible();
  await expect(visibleText(page, /est\. 1RM 110\.8 kg \(was 105\)/).first()).toBeVisible();
  await tap(page, 'Done');
  await expect(visibleText(page, /^5 wk$/)).toBeVisible();

  await tap(page, 'Progress');
  await expect(visibleText(page, 'Personal records')).toBeVisible();
  await expect(visibleText(page, '83.2 kg', false).first()).toBeVisible();
  await visibleText(page, 'Barbell Bench Press').first().click();
  await expect(visibleText(page, '110.8 kg').first()).toBeVisible();
  await expect(page.getByLabel(/over time/).filter({ visible: true })).toBeVisible();

  await page.goto('/body-weight');
  await input(page, 'e.g. 80.5').fill('82.6');
  await tap(page, 'Save');
  await expect(visibleText(page, '82.6 kg', false).first()).toBeVisible();
  expect(errors).toEqual([]);
});
