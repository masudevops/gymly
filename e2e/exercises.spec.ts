import { expect, test } from '@playwright/test';

import { input, signUp, tap, visibleText } from './helpers';

test('exercise guide: steps, form tip and muscle map from the library', async ({ page }) => {
  await signUp(page, 'guide');
  await tap(page, 'Browse the exercise library');
  await input(page, 'Search 140+ exercises').fill('barbell bench');
  await tap(page, 'Barbell Bench Press');

  await expect(visibleText(page, 'How to do it')).toBeVisible();
  await expect(visibleText(page, /mid-chest with elbows/).first()).toBeVisible();
  await expect(visibleText(page, /upper back tight/).first()).toBeVisible(); // form tip
  await expect(page.getByRole('img', { name: /Works chest, triceps, shoulders/ }).filter({ visible: true })).toBeVisible();
  await expect(visibleText(page, /No sessions yet/).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/exercise-guide.png', fullPage: true });
});
