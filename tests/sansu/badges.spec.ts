import { expect, test } from '@playwright/test';

test.describe('バッジ図鑑ページ', () => {
  test('バッジ図鑑ページが表示される', async ({ page }) => {
    await page.goto('/sansu-100/badges');
    await expect(page.getByText('🏅 バッジ図鑑')).toBeVisible();
  });

  test('進捗バーが表示される', async ({ page }) => {
    await page.goto('/sansu-100/badges');
    await expect(page.getByTestId('badge-progress')).toBeVisible();
  });

  test('カテゴリタブが表示される', async ({ page }) => {
    await page.goto('/sansu-100/badges');
    await expect(page.getByTestId('category-tabs')).toBeVisible();
    await expect(page.getByTestId('tab-all')).toBeVisible();
    await expect(page.getByTestId('tab-minigame')).toBeVisible();
  });

  test('バッジグリッドが表示される', async ({ page }) => {
    await page.goto('/sansu-100/badges');
    await expect(page.getByTestId('badge-grid')).toBeVisible();
  });

  test('カテゴリタブ切り替えができる', async ({ page }) => {
    await page.goto('/sansu-100/badges');
    await page.getByTestId('tab-speed').click();
    await expect(page.getByTestId('tab-speed')).toHaveClass(/bg-blue-600/);
  });

  test('ホームの「バッジ図鑑」リンクが存在する', async ({ page }) => {
    await page.goto('/sansu-100');
    await expect(page.getByTestId('badges-link')).toBeVisible();
  });
});
