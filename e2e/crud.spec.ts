import { expect, test } from '@playwright/test';

import { signUpAndLogin } from './helpers';

test('create, rename, and trash a note', async ({ page }) => {
  await signUpAndLogin(page);

  await page.goto('/notes');
  await page.getByRole('button', { name: 'New note' }).click();
  await expect(page).toHaveURL(/\/notes\/[^/]+$/);
  // "New note" navigates via window.location.href (full reload). Wait for the
  // page to settle so the fill isn't wiped by React hydration.
  await page.waitForLoadState('networkidle');

  const title = 'E2E Note';
  await page.getByLabel('Note title').fill(title);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await page.getByLabel('Back to notes').click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole('link', { name: title })).toBeVisible();

  await page.getByRole('link', { name: title }).click();
  await expect(page.getByLabel('Note title')).toHaveValue(title);

  await page.getByLabel('Delete note').click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByText(title)).toHaveCount(0);
});

test('create, complete, and delete a task', async ({ page }) => {
  await signUpAndLogin(page);

  await page.goto('/tasks');
  const title = 'E2E Task';
  await page.getByLabel('Task title').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole('checkbox', { name: 'Mark complete' }).click();
  await expect(page.getByRole('checkbox', { name: 'Mark incomplete' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete task' }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});
