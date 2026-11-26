import { expect, test } from '@playwright/test';

import { addExercises, autoAcceptDialogs, collectErrors, input, signUp, tap, visibleText } from './helpers';

test.describe('workout logging', () => {
  test('log a workout, see it in history, reuse it as a template with previous values', async ({ page }) => {
    autoAcceptDialogs(page);
    const errors = collectErrors(page);
    await signUp(page, 'log', { unit: 'lb' });

    await tap(page, 'Start empty workout');
    await addExercises(page, ['Barbell Bench Press', 'Plank']);

    await page.getByLabel('Set 1 weight').first().fill('135');
    await page.getByLabel('Set 1 reps').first().fill('10');
    await page.getByLabel('Complete set 1').first().click();
    await expect(page.getByLabel('Skip rest').filter({ visible: true })).toBeVisible(); // rest timer started
    await visibleText(page, 'Add set').first().click(); // bench is the first exercise card
    await page.getByLabel('Set 2 weight').first().fill('185');
    await page.getByLabel('Set 2 reps').first().fill('5');
    await page.getByLabel('Complete set 2').first().click();
    await page.getByLabel('Set 1 seconds').first().fill('60');
    await page.getByLabel('Complete set 1').last().click();
    await expect(visibleText(page, /3 sets · 2,275 lb/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

    await visibleText(page, 'Finish').first().click();
    await expect(visibleText(page, 'Workout complete')).toBeVisible();
    await expect(visibleText(page, '185 lb × 5', false).first()).toBeVisible();
    await expect(visibleText(page, /est\. 1RM/).first()).toBeVisible();
    await tap(page, 'Done');

    await tap(page, 'History');
    await expect(visibleText(page, /2× Barbell Bench Press/).first()).toBeVisible();

    // Template from scratch, then start it: "previous" column shows last session.
    await tap(page, 'Train');
    await tap(page, 'Create a template');
    await input(page, 'e.g. Upper Body A').fill('Push Day');
    await addExercises(page, ['Barbell Bench Press']);
    await tap(page, 'Save template');
    await expect(visibleText(page, 'Push Day').first()).toBeVisible();
    await visibleText(page, 'Start').first().click();
    await expect(visibleText(page, '135×10', false).first()).toBeVisible();
    await expect(visibleText(page, '185×5', false).first()).toBeVisible();

    // The in-progress workout survives a reload.
    await page.goto('/');
    await expect(visibleText(page, /In progress/).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('edit a saved workout to fix a typo', async ({ page }) => {
    autoAcceptDialogs(page);
    await signUp(page, 'edit');
    await tap(page, 'Start empty workout');
    await addExercises(page, ['Barbell Bench Press']);
    await page.getByLabel('Set 1 weight').first().fill('1000');
    await page.getByLabel('Set 1 reps').first().fill('5');
    await page.getByLabel('Complete set 1').first().click();
    await visibleText(page, 'Finish').first().click();
    await expect(visibleText(page, '1000 kg × 5', false).first()).toBeVisible();

    await page.getByLabel('Edit workout').filter({ visible: true }).click();
    await page.locator('input[aria-label="Set 1 weight"]:visible').fill('100');
    await tap(page, 'Save changes');
    await expect(visibleText(page, '100 kg × 5', false).first()).toBeVisible();
    await expect(page.getByText('1000 kg', { exact: false }).filter({ visible: true })).toHaveCount(0);
  });
});
