import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

test.describe('Анализ аудио файлов', () => {
  test('должен загрузить и обработать sound_test1.webm', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test1.webm');
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    // Ждём появления статистики
    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });
    
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('должен загрузить и обработать sound_test2.webm', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test2.webm');
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });
    
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('должен загрузить и обработать sound_test3.webm', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test3.webm');
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="bounce-count"]', { timeout: 10000, state: 'visible' });
    
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
  });

  test('индикатор загрузки должен исчезнуть после обработки файла', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test1.webm');
    
    // Загружаем файл
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    // Ждём что статистика появилась (файл обрабатывается быстро)
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
    // При threshold=0.5 (50%) первый пик (32%) отсекается → 3 пика
    // При threshold=0.1 (10%) все пики проходят → 4 пика
    
    // Тест проверяет что пересчёт работает через изменение URL параметра
    // Это обходной путь для сложности с Radix UI slider
    
    await page.goto('http://localhost:5173?threshold=0.5');
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test1.webm');
    
    // Загружаем файл с порогом 0.5
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    // Ждём появления статистики
    const bounceCountElement = page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible({ timeout: 10000 });
    
    // Проверяем количество пиков (должно быть 3 при threshold=0.5)
    let bounceCountText = await bounceCountElement.textContent();
    let bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(3);
    
    // Перезагружаем страницу с другим порогом
    await page.goto('http://localhost:5173?threshold=0.1');
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    // Загружаем тот же файл с порогом 0.1
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    // Ждём появления статистики
    await expect(bounceCountElement).toBeVisible({ timeout: 10000 });
    
    // Проверяем что количество пиков изменилось (должно быть 4 при threshold=0.1)
    bounceCountText = await bounceCountElement.textContent();
    bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBe(4);
  });
});
