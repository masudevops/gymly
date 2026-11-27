import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { autoAcceptDialogs, collectErrors, input, signUp, sql, tap, visibleText } from './helpers';

// 1×1 PNG, enough for the avatar upload path (picker → storage → signed URL).
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const userId = (email: string) => sql(`select id from auth.users where email = '${email}'`);
const avatarFiles = (uid: string) => Number(sql(`select count(*) from storage.objects where bucket_id = 'avatars' and name like '${uid}/%'`));

async function uploadPhoto(page: Page) {
  const chooser = page.waitForEvent('filechooser');
  await tap(page, 'Add photo');
  await (await chooser).setFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
  await expect(visibleText(page, 'Change photo')).toBeVisible({ timeout: 15_000 });
  // expo-image puts the label on a wrapper Playwright doesn't count as visible; the photo itself renders.
  await expect(page.getByRole('img', { name: 'Profile photo' }).first()).toBeAttached();
}

test('profile: real stats, autosaved preferences, name and photo', async ({ page }) => {
  autoAcceptDialogs(page);
  const errors = collectErrors(page);
  const email = await signUp(page, 'profile');
  const uid = userId(email);

  // 3 workouts across 2 weeks, plus one program started, as if the user had history.
  sql(`do $$ declare u uuid := '${uid}';
  begin
    insert into public.workouts (user_id, name, started_at, finished_at) values
      (u, 'A', now() - interval '21 days', now() - interval '21 days' + interval '1 hour'),
      (u, 'B', now() - interval '21 days', now() - interval '21 days' + interval '1 hour'),
      (u, 'C', now() - interval '7 days', now() - interval '7 days' + interval '1 hour');
    insert into public.program_enrollments (user_id, program_id, status, ended_at)
      values (u, (select id from public.programs order by slug limit 1), 'abandoned', now());
  end $$;`);

  await page.goto('/profile');
  await expect(page.getByLabel('3 Workouts')).toBeVisible();
  await expect(page.getByLabel('2 Weeks active')).toBeVisible();
  await expect(page.getByLabel('1 Program')).toBeVisible();
  // Deletion lives behind Settings → Account management, not on the main page.
  await expect(visibleText(page, 'Delete my account')).toHaveCount(0);

  // Preferences save as soon as they change.
  await page.getByRole('radio', { name: 'Pounds' }).filter({ visible: true }).click();
  await page.getByLabel('More workouts per week').filter({ visible: true }).click();
  await page.getByLabel('Longer rest').filter({ visible: true }).click();
  await expect.poll(() => sql(`select unit || ',' || training_days || ',' || rest_seconds from public.profiles where id = '${uid}'`)).toBe('lb,4,105');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Pounds' }).filter({ visible: true })).toHaveAttribute('aria-checked', 'true');
  await expect(visibleText(page, '1:45')).toBeVisible();

  // Name and photo.
  await page.getByLabel('Edit profile').filter({ visible: true }).click();
  await input(page, 'Your name').fill('Sam Lifter');
  await tap(page, 'Save');
  await expect(visibleText(page, 'Sam Lifter')).toBeVisible();

  await page.getByLabel('Edit profile').filter({ visible: true }).click();
  await uploadPhoto(page);
  expect(sql(`select avatar_path like '${uid}/%' from public.profiles where id = '${uid}'`)).toBe('t');
  expect(avatarFiles(uid)).toBe(1);
  await tap(page, 'Remove');
  await expect(visibleText(page, 'Add photo')).toBeVisible();
  await expect.poll(() => avatarFiles(uid)).toBe(0);
  expect(sql(`select avatar_path is null from public.profiles where id = '${uid}'`)).toBe('t');

  expect(errors).toEqual([]);
});

test('export downloads every set as CSV', async ({ page }) => {
  const email = await signUp(page, 'export');
  sql(`do $$ declare u uuid := '${userId(email)}';
    b uuid := (select id from public.exercises where owner_id is null and name = 'Barbell Bench Press'); w uuid; we uuid;
  begin
    insert into public.workouts (user_id, name, started_at, finished_at) values (u, 'Bench day', now() - interval '2 days', now() - interval '2 days' + interval '1 hour') returning id into w;
    insert into public.workout_exercises (workout_id, exercise_id, position) values (w, b, 0) returning id into we;
    insert into public.workout_sets (workout_exercise_id, position, weight_kg, reps) values (we, 0, 100, 5), (we, 1, 102.5, 3);
  end $$;`);

  await page.goto('/profile');
  const download = page.waitForEvent('download');
  await tap(page, 'Export data');
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^gymly-workouts-\d{4}-\d{2}-\d{2}\.csv$/);
  const lines = readFileSync((await file.path())!, 'utf8').trim().split('\n');
  expect(lines[0]).toBe('date,workout,exercise,set,warmup,weight_kg,reps,duration_seconds,rpe');
  expect(lines.slice(1).map((l) => l.split(',').slice(1, 7).join(','))).toEqual(['Bench day,Barbell Bench Press,1,no,100,5', 'Bench day,Barbell Bench Press,2,no,102.5,3']);
  await expect(visibleText(page, 'Downloaded. Check your downloads folder')).toBeVisible();
});

test('account deletion requires typing DELETE and removes the user and their photos', async ({ page }) => {
  autoAcceptDialogs(page);
  const email = await signUp(page, 'delete');
  const uid = userId(email);

  await page.goto('/settings/edit-profile');
  await uploadPhoto(page);
  expect(avatarFiles(uid)).toBe(1);

  await page.goto('/profile');
  await tap(page, 'Account management');
  await expect(visibleText(page, /permanently deletes your account/, false)).toBeVisible();
  const del = page.getByRole('button', { name: 'Delete my account' }).filter({ visible: true });
  await expect(del).toBeDisabled();
  await input(page, 'DELETE').fill('delete');
  await expect(del).toBeDisabled();
  await input(page, 'DELETE').fill('DELETE');
  await expect(del).toBeEnabled();
  await del.click();

  await expect(visibleText(page, 'Forgot password?')).toBeVisible({ timeout: 15_000 });
  expect(sql(`select count(*) from auth.users where email = '${email}'`)).toBe('0');
  expect(avatarFiles(uid)).toBe(0);
});
