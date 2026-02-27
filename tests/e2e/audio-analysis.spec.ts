import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

test.describe('Audio File Analysis', () => {
  test('loads and processes sound_test1.webm via button', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test1.webm');

    // Click "Select File" button
    await page.getByRole('button', { name: 'Select File' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Wait for statistics to appear
    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });

    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('loads and processes sound_test2.webm via button', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test2.webm');

    // Click "Select File" button
    await page.getByRole('button', { name: 'Select File' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });

    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('loads and processes sound_test3.webm via button', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test3.webm');

    // Click "Select File" button
    await page.getByRole('button', { name: 'Select File' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });

    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('loading indicator disappears after file processing', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test1.webm');

    // Use button to upload
    await page.getByRole('button', { name: 'Select File' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Wait for statistics to appear
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 10000 });

    // Check that loading indicators are not visible
    const uploadingText = page.getByText('Loading...');
    const processingText = page.getByText('Processing...');

    await expect(uploadingText).not.toBeVisible({ timeout: 1000 });
    await expect(processingText).not.toBeVisible({ timeout: 1000 });
  });

  test('threshold change recalculates peaks for sound_test1.webm', async ({ page }) => {
    // sound_test1.webm has 4 peaks with relative amplitudes: 32%, 72%, 75%, 100%
    // At threshold=0.3 (30%) all peaks pass → 4 peaks
    // When clicking track to increase threshold to ~0.5, first peak (32%) is filtered → 3 peaks

    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test1.webm');

    // Upload file via button
    await page.getByRole('button', { name: 'Select File' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Wait for statistics
    const bounceCountElement = page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 10000 });

    // Check initial peak count (should be 4 at threshold=0.3)
    let bounceCountText = await bounceCountElement.textContent();
    let bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(4);

    // Click on slider track to increase threshold
    await page.getByTestId('threshold-slider').locator('span').nth(0).click();

    // Wait for recalculation
    await page.waitForTimeout(500);

    // Check that peak count decreased to 3
    bounceCountText = await bounceCountElement.textContent();
    bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(3);
  });

  test('microphone recording and download', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click "Record from Mic"
    await page.getByRole('button', { name: 'Record from Mic' }).click();

    // Wait for recording to start
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible({ timeout: 5000 });

    // Wait 2.5 seconds for recording (WAV file is 3 seconds, stop before looping)
    await page.waitForTimeout(2500);

    // Click "Stop Recording"
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    // Wait for download button to appear
    await expect(page.getByRole('link', { name: 'Download Recording' })).toBeVisible({ timeout: 10000 });

    // Check that button has correct download attribute
    const downloadLink = page.getByRole('link', { name: 'Download Recording' });
    await expect(downloadLink).toHaveAttribute('download', /recording-.*\.webm/);
    
    // Check that peaks are detected (WAV file contains 4 peaks)
    const bounceCountElement = page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 5000 });
    const bounceCountText = await bounceCountElement.textContent();
    const bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(4); // WAV file contains exactly 4 peaks (0.5s, 1.1s, 1.7s, 2.3s)
  });
});
