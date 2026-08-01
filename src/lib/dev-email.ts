// Dev-only email sink — logs the link instead of sending. Swap for a real provider later.
import { appendFileSync } from 'node:fs';

export function sendDevEmail(subject: string, url: string): void {
  // eslint-disable-next-line no-console
  console.log(`[LifeOS dev email]\n  Subject: ${subject}\n  ${url}`);

  // E2E hook: when E2E_EMAIL_FILE is set, persist the link for tests to read
  // so they can complete email verification. No-op in production.
  if (process.env['E2E_EMAIL_FILE']) {
    appendFileSync(process.env['E2E_EMAIL_FILE'], JSON.stringify({ subject, url }) + '\n');
  }
}
