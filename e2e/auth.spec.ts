import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

// Populated by src/lib/dev-email.ts (E2E_EMAIL_FILE) so tests can complete the
// real email-verification step instead of bypassing it.
const EMAIL_FILE = path.join(process.cwd(), '.e2e-email.log');

function emailUrls(): string[] {
  if (!existsSync(EMAIL_FILE)) return [];
  return readFileSync(EMAIL_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => (JSON.parse(line) as { url: string }).url);
}

test('sign up, verify email, sign in, and reach the dashboard', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'E2E-password-123!';
  rmSync(EMAIL_FILE, { force: true });

  await page.goto('/signup');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/verify-email/);

  await expect.poll(async () => emailUrls().length, { timeout: 20_000 }).toBeGreaterThan(0);

  await page.goto(emailUrls()[0] as string);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/good morning|good afternoon|good evening/i).first()).toBeVisible();
});
