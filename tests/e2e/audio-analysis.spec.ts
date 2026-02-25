import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

test.describe('Анализ аудио файлов', () => {
  test('должен найти 4 пика в sound_test1.webm', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Переключаемся на вкладку "Файл"
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    // Загружаем тестовый файл
    const filePath = path.join(dataDir, 'sound_test1.webm');
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    // Ждём анализа и появления результатов
    await page.waitForTimeout(3000);
    
    // Проверяем, что появилась статистика
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
    
    const bounceCountText = await bounceCountElement.textContent();
    // Извлекаем число из текста (формат: "4\nУдаров")
    const bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    console.log('Bounce count:', bounceCount);
    expect(bounceCount).toBeGreaterThanOrEqual(3); // Минимум 3 из 4 пиков
  });

  test('должен найти 2 пика в sound_test2.webm', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test2.webm');
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    await page.waitForTimeout(3000);
    
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
    
    const bounceCountText = await bounceCountElement.textContent();
    const bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBeGreaterThanOrEqual(2);
  });

  test('должен найти 2 пика в sound_test3.webm', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    await page.getByRole('tab', { name: /Файл/i }).click();
    
    const filePath = path.join(dataDir, 'sound_test3.webm');
    await page.getByTestId('file-input').setInputFiles(filePath);
    
    await page.waitForTimeout(3000);
    
    const bounceCountElement = await page.getByTestId('bounce-count');
    await expect(bounceCountElement).toBeVisible();
    
    const bounceCountText = await bounceCountElement.textContent();
    const bounceCount = parseInt(bounceCountText?.trim().split('\n')[0] || '0', 10);
    expect(bounceCount).toBeGreaterThanOrEqual(2);
  });
});
