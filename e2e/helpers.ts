import { expect, type Page } from '@playwright/test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

// Populated by src/lib/dev-email.ts (E2E_EMAIL_FILE) so tests can complete the
// real email-verification step instead of bypassing it. The suite runs with a
// single worker so this shared file is never read concurrently.
const EMAIL_FILE = path.join(process.cwd(), '.e2e-email.log');
const PASSWORD = 'E2E-password-123!';

function emailUrls(): string[] {
  if (!existsSync(EMAIL_FILE)) return [];
  return readFileSync(EMAIL_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as { url: string };
        return parsed.url ? [parsed.url] : [];
      } catch {
        // Skip a partially-written line while the log is being appended.
        return [];
      }
    });
}

// The first DB-touching request after `next start` boots intermittently loses
// its response (client hangs on a successful signup), while every later request
// works. Warm the Neon pool with a bounded login attempt before the real flow.
async function warmUp(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.race([
      fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'warmup-does-not-exist@example.com', password: 'x' }),
      }).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ]);
  });
}

// The login POST intermittently loses its response (Neon cold start), leaving
// the page on /login. Retry the submission rather than failing the whole test.
async function signIn(page: Page, email: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
      return;
    } catch {
      if (attempt >= 3) {
        throw new Error('Sign-in did not reach /dashboard after 3 attempts');
      }
    }
  }
}

export async function signUpAndLogin(page: Page): Promise<void> {
  const email = `e2e-${Date.now()}@example.com`;
  rmSync(EMAIL_FILE, { force: true });

  await page.goto('/signup');
  await warmUp(page);
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/verify-email/);
  await expect.poll(async () => emailUrls().length, { timeout: 20_000 }).toBeGreaterThan(0);
  await page.goto(emailUrls()[0] as string);

  await page.goto('/login');
  await warmUp(page);
  await signIn(page, email);
}
