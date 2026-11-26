import { expect, test } from '@playwright/test';

import { autoAcceptDialogs, input, latestEmailLink, signUp, tap, visibleText } from './helpers';

test('password reset via email, then sign in with the new password', async ({ page }) => {
  autoAcceptDialogs(page);
  const email = await signUp(page, 'reset');
  await tap(page, 'Profile');
  await tap(page, 'Sign out');
  await expect(visibleText(page, 'Forgot password?')).toBeVisible();

  await page.goto('/forgot-password');
  await input(page, 'you@example.com').fill(email);
  await tap(page, 'Send reset link');
  await expect(visibleText(page, 'Check your inbox')).toBeVisible();

  const link = await latestEmailLink(email);
  expect(decodeURIComponent(link)).toContain('/reset-password');
  await page.goto(link);
  await expect(visibleText(page, 'Set a new password')).toBeVisible();
  await input(page, 'At least 8 characters').fill('NewPass456!');
  await input(page, 'Repeat it').fill('NewPass456!');
  await tap(page, 'Update password');
  await expect(visibleText(page, 'Password updated')).toBeVisible();

  await tap(page, 'Continue');
  await tap(page, 'Profile');
  await tap(page, 'Sign out');
  await page.goto('/sign-in');
  await input(page, 'you@example.com').fill(email);
  await input(page, 'At least 8 characters').fill('NewPass456!');
  await tap(page, 'Sign in');
  await expect(visibleText(page, 'Start empty workout')).toBeVisible();
});

test('unknown routes show a 404 page', async ({ page }) => {
  await page.goto('/definitely-not-a-page');
  await expect(visibleText(page, 'Page not found')).toBeVisible();
});
