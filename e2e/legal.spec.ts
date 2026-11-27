import { expect, test } from '@playwright/test';

import { autoAcceptDialogs, collectErrors, signUp, tap, visibleText } from './helpers';

test('privacy and terms are public and linked from the landing page and sign-up', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/privacy');
  await expect(visibleText(page, 'Privacy Policy').first()).toBeVisible();
  await expect(visibleText(page, /support@mygymly\.com/, false).first()).toBeVisible();

  await tap(page, 'Terms of Service');
  await expect(page).toHaveURL(/\/terms$/);
  await expect(visibleText(page, 'Health and safety')).toBeVisible();

  await page.goto('/welcome');
  await tap(page, 'Privacy');
  await expect(page).toHaveURL(/\/privacy$/);

  await page.goto('/sign-up');
  await expect(visibleText(page, /By creating an account, you agree/, false)).toBeVisible();
  expect(errors).toEqual([]);
});

test('signed-in users can open the legal pages and contact support from Profile', async ({ page }) => {
  autoAcceptDialogs(page);
  await signUp(page, 'legal');
  await tap(page, 'Profile');
  await expect(visibleText(page, 'Contact support')).toBeVisible();
  await tap(page, 'Terms of Service');
  await expect(page).toHaveURL(/\/terms$/);
  await expect(visibleText(page, 'Terms of Service').first()).toBeVisible();
});

test('Share Gymly copies the public homepage link, not the current page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // Force the copy fallback (headless Chromium may expose navigator.share).
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await signUp(page, 'share');
  await tap(page, 'Profile');
  await tap(page, 'Share Gymly');
  await expect(visibleText(page, 'Link copied')).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(new URL('/', page.url()).toString());
});
