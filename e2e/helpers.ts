import { execFileSync } from 'node:child_process';

import { expect, type Locator, type Page } from '@playwright/test';

/** Unique throwaway address per test (local Supabase only; never runs against production). */
export const uniqueEmail = (tag: string) => `e2e+${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@gymly.test`;

/** Visible elements only: on web, previous stack screens stay mounted (hidden) in the DOM. */
export const visibleText = (page: Page, text: string | RegExp, exact = true): Locator =>
  page.getByText(text, typeof text === 'string' ? { exact } : undefined).filter({ visible: true });

export const tap = (page: Page, text: string) => visibleText(page, text).last().click();

export const input = (page: Page, placeholder: string) => page.locator(`input[placeholder="${placeholder}"]:visible`);

/** Accept confirm() dialogs (web confirmations). */
export function autoAcceptDialogs(page: Page) {
  page.on('dialog', (d) => d.accept());
}

/** Collects uncaught page errors so tests can assert none happened. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

type Onboarding = { goal?: string; experience?: string; days?: number; unit?: 'kg' | 'lb'; name?: string };

/** Signs up a fresh user and completes onboarding. Returns the email. */
export async function signUp(page: Page, tag: string, o: Onboarding = {}) {
  const email = uniqueEmail(tag);
  await page.goto('/sign-up');
  await input(page, 'you@example.com').fill(email);
  await input(page, 'At least 8 characters').fill('Str0ngPass!');
  await tap(page, 'Create account');
  await expect(visibleText(page, 'Step 1 of 4')).toBeVisible({ timeout: 20_000 });
  if (o.name) await input(page, 'What should we call you?').fill(o.name);
  await tap(page, o.goal ?? 'Get stronger');
  await tap(page, 'Continue');
  await tap(page, o.experience ?? 'Beginner');
  await tap(page, 'Continue');
  await page.getByRole('radio', { name: String(o.days ?? 3), exact: true }).filter({ visible: true }).click().catch(() => tap(page, String(o.days ?? 3)));
  await tap(page, 'Continue');
  await tap(page, o.unit === 'lb' ? 'Pounds (lb)' : 'Kilograms (kg)');
  await tap(page, "Let's go");
  await expect(visibleText(page, 'Start empty workout')).toBeVisible({ timeout: 20_000 });
  return email;
}

/** Adds exercises from the picker inside an active workout or template editor. */
export async function addExercises(page: Page, names: string[]) {
  await tap(page, 'Add exercises');
  for (const name of names) {
    await input(page, 'Search 140+ exercises').fill(name);
    await tap(page, name);
  }
  await visibleText(page, new RegExp(`^Add ${names.length} exercises?$`)).click();
}

/** Runs SQL as the postgres superuser against the local Supabase database (for seeding history). */
export function sql(query: string): string {
  return execFileSync('docker', ['exec', '-i', 'supabase_db_gymly', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-tA'], {
    input: query,
  })
    .toString()
    .trim();
}

/** Latest email for an address from the local Mailpit inbox (Supabase local auth emails). */
export async function latestEmailLink(email: string, contains = 'verify'): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const list = (await res.json()) as { messages?: { ID: string }[] };
    if (list.messages?.length) {
      const msg = (await (await fetch(`http://127.0.0.1:54324/api/v1/message/${list.messages[0].ID}`)).json()) as { HTML?: string; Text?: string };
      const link = (msg.HTML || msg.Text || '').match(new RegExp(`https?://[^"'\\s<>]*${contains}[^"'\\s<>]*`))?.[0];
      if (link) return link.replace(/&amp;/g, '&');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email with a "${contains}" link for ${email}`);
}
