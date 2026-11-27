import { expect, test } from '@playwright/test';

import { autoAcceptDialogs, collectErrors, signUp, tap, visibleText } from './helpers';

test('signed-out visitors land on the welcome page and can reach sign-up and sign-in', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(visibleText(page, 'Get stronger.')).toBeVisible();
  await expect(visibleText(page, 'Track your workouts')).toBeVisible();

  await tap(page, 'Get Started');
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(visibleText(page, 'Create your account')).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/welcome$/);

  await tap(page, 'Sign in');
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(visibleText(page, 'Welcome back')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the back button on a directly opened sign-in page goes to the welcome page', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByRole('button', { name: 'Back' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/welcome$/);
});

test('signed-in users skip the welcome page, and signing out returns to it', async ({ page }) => {
  autoAcceptDialogs(page);
  await signUp(page, 'landing');
  await page.goto('/welcome');
  await expect(visibleText(page, 'Start empty workout')).toBeVisible();
  await page.goto('/');
  await expect(visibleText(page, 'Start empty workout')).toBeVisible();

  await tap(page, 'Profile');
  await tap(page, 'Sign out');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(visibleText(page, 'Get stronger.')).toBeVisible();
});
