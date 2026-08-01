import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// Distinct port so E2E never collides with a running `pnpm dev` on 3000.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const EMAIL_FILE = path.join(process.cwd(), '.e2e-email.log');

export default defineConfig({
  testDir: './e2e',
  // Serial, single worker: tests share the .e2e-email.log sink, so they must
  // never run concurrently or they'd read each other's verification links.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    // Use the system Edge on Windows so no browser download is needed locally;
    // CI installs bundled Chromium via `playwright install`.
    ...(!process.env.CI && process.platform === 'win32' ? { channel: 'msedge' } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Run against `next start` (production build) — `next dev` compiles on demand
  // and blows past test timeouts. Build first with `pnpm build`.
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    // Never reuse a server on the port: a stale/broken `next start` was once
    // silently reused and hung the signup request. Error loudly instead.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      // Override the base URL in .env so verification links target the E2E port.
      BETTER_AUTH_URL: BASE_URL,
      E2E_EMAIL_FILE: EMAIL_FILE,
    },
  },
});
