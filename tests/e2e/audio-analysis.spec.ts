import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

test.describe('Анализ аудио файлов', () => {
  test('должен загрузить и обработать sound_test1.webm через кнопку', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test1.webm');
    
    // Кликаем на кнопку "Выбрать файл"
    await page.getByRole('button', { name: 'Выбрать файл' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Ждём появления статистики
    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });

    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('должен загрузить и обработать sound_test2.webm через кнопку', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test2.webm');
    
    // Кликаем на кнопку "Выбрать файл"
    await page.getByRole('button', { name: 'Выбрать файл' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });

    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('должен загрузить и обработать sound_test3.webm через кнопку', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test3.webm');
    
    // Кликаем на кнопку "Выбрать файл"
    await page.getByRole('button', { name: 'Выбрать файл' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });

    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('индикатор загрузки должен исчезнуть после обработки файла', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test1.webm');
    
    // Используем кнопку для загрузки
    await page.getByRole('button', { name: 'Выбрать файл' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Ждём что статистика появилась
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 10000 });

    // Проверяем что индикаторы загрузки не видны
    const uploadingText = page.getByText('Загрузка...');
    const processingText = page.getByText('Обработка...');

    await expect(uploadingText).not.toBeVisible({ timeout: 1000 });
    await expect(processingText).not.toBeVisible({ timeout: 1000 });
  });

  test('изменение порога должно пересчитывать пики для sound_test1.webm', async ({ page }) => {
    // sound_test1.webm имеет 4 пика с относительными амплитудами: 32%, 72%, 75%, 100%
    // При threshold=0.2 (20%) все пики проходят → 4 пика
    // При увеличении порога до 0.5 первый пик (32%) отсекается → 3 пика

    await page.goto('http://localhost:5173');

    const filePath = path.join(dataDir, 'sound_test1.webm');

    // Загружаем файл через кнопку
    await page.getByRole('button', { name: 'Выбрать файл' }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Ждём появления статистики
    const bounceCountElement = page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 10000 });

    // Проверяем начальное количество пиков (должно быть 4 при threshold=0.2)
    let bounceCountText = await bounceCountElement.textContent();
    let bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(4);

    // page.locator('span').nth(5) = корневой элемент слайдера с data-testid="threshold-slider"
    // page.locator('span').nth(6) = track слайдера (getByTestId('threshold-slider').locator('span').nth(0))
    // Кликаем на track слайдера для увеличения порога
    await page.getByTestId('threshold-slider').locator('span').nth(0).click();

    // Ждём пересчёта
    await page.waitForTimeout(500);

    // Проверяем что количество пиков уменьшилось до 3
    bounceCountText = await bounceCountElement.textContent();
    bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(3);
  });

  test('запись с микрофона и скачивание', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Нажимаем "Запись с микрофона"
    await page.getByRole('button', { name: 'Запись с микрофона' }).click();

    // Ждём начала записи
    await expect(page.getByRole('button', { name: 'Остановить запись' })).toBeVisible({ timeout: 5000 });

    // Ждём 2.5 секунды для записи (WAV файл 3 секунды, чтобы не зацикливался)
    await page.waitForTimeout(2500);

    // Нажимаем "Остановить запись"
    await page.getByRole('button', { name: 'Остановить запись' }).click();

    // Ждём появления кнопки скачивания
    await expect(page.getByRole('link', { name: 'Скачать запись' })).toBeVisible({ timeout: 10000 });

    // Проверяем что кнопка имеет правильный download атрибут
    const downloadLink = page.getByRole('link', { name: 'Скачать запись' });
    await expect(downloadLink).toHaveAttribute('download', /recording-.*\.webm/);
    
    // Проверяем что пики обнаружены (WAV файл содержит 4 пика)
    const bounceCountElement = page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 5000 });
    const bounceCountText = await bounceCountElement.textContent();
    const bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(4); // WAV файл содержит ровно 4 пика (0.5s, 1.1s, 1.7s, 2.3s)
  });
});
