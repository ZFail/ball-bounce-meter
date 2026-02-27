import { test, expect } from '@playwright/test';

test('загрузка главной страницы', async ({ page }) => {
  await page.goto('/');

  // Проверяем заголовок
  await expect(page).toHaveTitle(/Ball Bounce Meter/);

  // Проверяем основной заголовок
  await expect(page.getByRole('heading', { name: 'Ball Bounce Meter' })).toBeVisible();
});

test('отображение кнопок управления', async ({ page }) => {
  await page.goto('/');

  // Проверяем наличие кнопок
  await expect(page.getByRole('button', { name: 'Запись с микрофона' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выбрать файл' })).toBeVisible();
});

test('отображение настроек детекции', async ({ page }) => {
  await page.goto('/');

  // Проверяем наличие слайдеров настроек
  await expect(page.getByText('Чувствительность (порог)')).toBeVisible();
  await expect(page.getByText('Мин. расстояние между ударами')).toBeVisible();
});

test('отображение панели статистики', async ({ page }) => {
  await page.goto('/');

  // Проверяем наличие панели статистики
  await expect(page.getByText('Статистика')).toBeVisible();
  await expect(page.getByText('Нет данных для отображения')).toBeVisible();
});

test('отображение панели истории', async ({ page }) => {
  await page.goto('/');

  // Проверяем наличие панели истории (заголовок)
  await expect(page.getByTestId('history-title')).toBeVisible();
});
