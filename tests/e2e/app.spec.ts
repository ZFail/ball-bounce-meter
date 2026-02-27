import { test, expect } from '@playwright/test';

test('loads main page', async ({ page }) => {
  await page.goto('/');

  // Check header
  await expect(page).toHaveTitle(/Ball Bounce Meter/);
  await expect(page.getByRole('heading', { name: 'Ball Bounce Meter' })).toBeVisible();
});

test('displays control buttons', async ({ page }) => {
  await page.goto('/');

  // Check buttons
  await expect(page.getByRole('button', { name: 'Record from Mic' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select File' })).toBeVisible();
});

test('displays detection settings', async ({ page }) => {
  await page.goto('/');

  // Check settings sliders
  await expect(page.getByText('Sensitivity (Threshold)')).toBeVisible();
  await expect(page.getByText('Min Distance Between Bounces')).toBeVisible();
});

test('displays statistics panel', async ({ page }) => {
  await page.goto('/');

  // Check statistics panel - "No data to display" is unique to empty statistics
  await expect(page.getByText('No data to display')).toBeVisible();
});

test('displays history panel', async ({ page }) => {
  await page.goto('/');

  // Check history panel title
  await expect(page.getByTestId('history-title')).toBeVisible();
});
