import { expect, test } from '@playwright/test';

import { autoAcceptDialogs, signUp, tap, visibleText } from './helpers';

test('programs: pick by days per week, start a plan, advance after a session', async ({ page }) => {
  autoAcceptDialogs(page);
  await signUp(page, 'programs', { experience: 'Intermediate', days: 4 });

  await tap(page, 'Programs');
  await expect(visibleText(page, 'How many days a week can you train?')).toBeVisible();
  const daysPicker = page.getByRole('radiogroup', { name: 'Days per week' }).filter({ visible: true });
  await expect(daysPicker.locator('[role="radio"][aria-checked="true"]')).toHaveAttribute('aria-label', '4 days per week');
  await expect(visibleText(page, 'Recommended for you')).toBeVisible();
  await expect(visibleText(page, 'Upper / Lower Strength')).toBeVisible();

  await page.getByRole('radio', { name: '3 days per week' }).filter({ visible: true }).click();
  await tap(page, 'Foundations Full Body');
  await tap(page, 'Start this program');
  await expect(visibleText(page, /Week 1 · Full Body A/).first()).toBeVisible();

  await tap(page, "Start today's session");
  await expect(page.getByLabel('Set 1 reps').first()).toHaveValue('8'); // target pre-filled
  await expect(page.getByLabel('Set 1 seconds').first()).toHaveValue('30'); // timed target pre-filled
  await page.getByLabel('Set 1 weight').first().fill('20');
  await page.getByLabel('Complete set 1').first().click();
  await visibleText(page, 'Finish').first().click();
  await tap(page, 'Done');
  await expect(visibleText(page, /Week 1 · Full Body B/).first()).toBeVisible();
  await expect(visibleText(page, /1 of 24 sessions done/).first()).toBeVisible();
});
