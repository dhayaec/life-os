import { expect, test } from '@playwright/test';

import { signUpAndLogin } from './helpers';

test('sign up, verify email, sign in, and reach the dashboard', async ({ page }) => {
  await signUpAndLogin(page);

  await expect(page.getByText(/good morning|good afternoon|good evening/i).first()).toBeVisible();
});
