import { expect, test } from '@playwright/test';

import { autoAcceptDialogs, signUp, sql, tap, visibleText } from './helpers';

/** Seeds one finished workout per entry: [exercise name, weight kg, reps per set], oldest first. */
function seedHistory(email: string, sessions: [string, number, number[]][]) {
  sessions.forEach(([exercise, kg, reps], i) => {
    sql(`do $$ declare
      u uuid := (select id from auth.users where email = '${email}');
      w uuid; we uuid;
    begin
      insert into public.workouts (user_id, name, started_at, finished_at)
        values (u, 'Earlier', now() - interval '${10 - i} days', now() - interval '${10 - i} days' + interval '1 hour') returning id into w;
      insert into public.workout_exercises (workout_id, exercise_id, position)
        values (w, (select id from public.exercises where name = '${exercise}' and owner_id is null), 0) returning id into we;
      insert into public.workout_sets (workout_exercise_id, position, weight_kg, reps)
        select we, r.pos - 1, ${kg}, r.reps from unnest(array[${reps.join(',')}]) with ordinality as r(reps, pos);
    end $$;`);
  });
}

test('program sessions suggest the next weight, apply on tap, and can be switched off', async ({ page }) => {
  autoAcceptDialogs(page);
  const email = await signUp(page, 'overload');
  seedHistory(email, [
    ['Seated Cable Row', 40, [8, 8]],
    ['Seated Cable Row', 40, [9, 8]],
    ['Seated Cable Row', 40, [8, 7]],
    ['Goblet Squat', 20, [10, 10, 10]],
  ]);

  await tap(page, 'Programs');
  await page.getByRole('radio', { name: '3 days per week' }).filter({ visible: true }).click();
  await tap(page, 'Foundations Full Body');
  await tap(page, 'Start this program');
  await tap(page, "Start today's session");

  // Top of the 8-10 range on every set: add one dumbbell step. Three misses below 10-12: deload.
  const squatHint = page.getByRole('button', { name: /Last: 20 kg × 10, 10, 10 → try 22 kg × 8/ });
  await expect(squatHint).toBeVisible();
  await expect(visibleText(page, /3 sessions short: try 35 kg and build back up/, false)).toBeVisible();

  await squatHint.click();
  await expect(page.getByLabel('Set 1 weight').first()).toHaveValue('22');
  await expect(page.getByLabel('Set 3 weight').first()).toHaveValue('22');

  // Switch hints off in Profile; the session no longer shows them.
  await page.goto('/profile');
  await page.getByRole('switch', { name: 'Progression hints' }).filter({ visible: true }).click();
  await expect.poll(() => sql(`select progression_hints from public.profiles p join auth.users u on u.id = p.id where u.email = '${email}'`)).toBe('f');
  await page.goto('/workout');
  await expect(page.getByLabel('Set 1 weight').first()).toBeVisible();
  await expect(visibleText(page, /Last: 20 kg/, false)).toHaveCount(0);
});
