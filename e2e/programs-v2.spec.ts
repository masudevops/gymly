import { expect, test, type Page } from '@playwright/test';

import { addExercises, autoAcceptDialogs, collectErrors, input, signUp, sql, tap, visibleText } from './helpers';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();

test('featured programs, level filter and a preview with guidance', async ({ page }) => {
  const errors = collectErrors(page);
  await signUp(page, 'featured', { experience: 'Intermediate', days: 6 });
  await tap(page, 'Programs');

  await expect(visibleText(page, 'Featured')).toBeVisible();
  await expect(visibleText(page, 'Golden Era Split: Classic')).toBeVisible();
  // Intermediate + 6 days recommends the moderate-volume PPL, not the advanced one.
  await expect(visibleText(page, 'PPL Hypertrophy')).toBeVisible();
  await page.getByRole('radio', { name: 'Advanced' }).filter({ visible: true }).click();
  // The card carrying the badge is Push Pull Legs (ancestors also contain the other cards, so exclude them).
  const recommended = page.locator('div').filter({ hasText: 'Recommended for you' }).filter({ hasText: 'Push Pull Legs' }).filter({ hasNotText: 'PPL Hypertrophy' });
  await expect(recommended.filter({ visible: true }).first()).toBeVisible();

  await button(page, 'Explore program').click();
  await expect(visibleText(page, 'Golden Era Split: Classic')).toBeVisible();
  await expect(visibleText(page, 'Muscles worked')).toBeVisible();
  await expect(visibleText(page, 'Progression')).toBeVisible();
  await expect(visibleText(page, /not affiliated with or endorsed by/, false)).toBeVisible();
  expect(errors).toEqual([]);
});

test('customize a built-in program without changing the original, follow it, then delete it', async ({ page }) => {
  autoAcceptDialogs(page);
  await signUp(page, 'customize', { experience: 'Beginner', days: 6 });
  const originalBefore = sql(
    "select string_agg(e.name || ':' || x.sets, ',' order by d.position, x.position) from programs p join program_days d on d.program_id = p.id join program_day_exercises x on x.program_day_id = d.id join exercises e on e.id = x.exercise_id where p.slug = 'ppl-starter'",
  );

  await tap(page, 'Programs');
  await tap(page, 'PPL Starter');
  await button(page, 'Customize').click();
  await expect(visibleText(page, 'Customize program')).toBeVisible();

  await input(page, 'e.g. My Upper / Lower').fill('My PPL');
  await page.locator('input[value="Push A"]:visible').fill('Chest Day');
  await button(page, 'Remove Triceps Pushdown').click();
  await button(page, 'Edit sets, reps and rest for Machine Chest Press').click();
  await button(page, 'More sets of Machine Chest Press').click();
  await button(page, 'Save program').click();

  // Lands on the copy's preview.
  await expect(visibleText(page, 'My PPL')).toBeVisible();
  await expect(visibleText(page, 'Custom')).toBeVisible();
  await expect(visibleText(page, 'Chest Day')).toBeVisible();
  await expect(visibleText(page, '4 × 8–12 reps').first()).toBeVisible();
  await expect(visibleText(page, 'Triceps Pushdown')).toHaveCount(0);

  // The built-in is untouched.
  expect(sql(
    "select string_agg(e.name || ':' || x.sets, ',' order by d.position, x.position) from programs p join program_days d on d.program_id = p.id join program_day_exercises x on x.program_day_id = d.id join exercises e on e.id = x.exercise_id where p.slug = 'ppl-starter'",
  )).toBe(originalBefore);

  // Follow it: the first session uses the edited day.
  await button(page, 'Start this program').click();
  await expect(visibleText(page, /Week 1 · Chest Day/).first()).toBeVisible();

  // It's listed under My programs.
  await page.goto('/programs');
  await expect(visibleText(page, 'My programs')).toBeVisible();
  await tap(page, 'My PPL');

  await button(page, 'Delete program').click();
  await expect(visibleText(page, 'My programs')).toHaveCount(0);
  await expect(visibleText(page, /Up next/, false)).toHaveCount(0);
});

test('create a custom program from scratch', async ({ page }) => {
  await signUp(page, 'scratch');
  await tap(page, 'Programs');
  await tap(page, 'Create custom program');
  await expect(visibleText(page, 'New program')).toBeVisible();

  await button(page, 'Save program').click();
  await expect(visibleText(page, 'Give your program a name.')).toBeVisible();

  await input(page, 'e.g. My Upper / Lower').fill('Two-Day Basics');
  await page.locator('input[value="Day 1"]:visible').fill('Upper');
  await addExercises(page, ['Barbell Bench Press', 'Barbell Row']);
  await button(page, 'Add session').click();
  await page.locator('input[value="Day 2"]:visible').fill('Lower');
  await page.getByRole('button', { name: 'Add exercises', exact: true }).filter({ visible: true }).last().click();
  await input(page, 'Search 140+ exercises').fill('Back Squat');
  await tap(page, 'Back Squat');
  await visibleText(page, 'Add 1 exercise').click();

  // Swap an exercise for another one.
  await button(page, 'Replace Barbell Row').click();
  await input(page, 'Search 140+ exercises').fill('Lat Pulldown');
  await tap(page, 'Lat Pulldown');

  await button(page, 'Save program').click();
  await expect(visibleText(page, 'Two-Day Basics')).toBeVisible();
  await expect(visibleText(page, 'Lat Pulldown')).toBeVisible();
  await expect(visibleText(page, 'Barbell Row')).toHaveCount(0);
  await expect(visibleText(page, '2×')).toBeVisible();
});
