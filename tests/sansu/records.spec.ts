import { expect, test } from '@playwright/test';

test.describe('ベスト記録ページ', () => {
  test('記録ページが表示される', async ({ page }) => {
    await page.goto('/sansu-100/records');
    await expect(page.getByText('🏆 ベスト記録')).toBeVisible();
  });

  test('記録テーブルが表示される', async ({ page }) => {
    await page.goto('/sansu-100/records');
    await expect(page.getByTestId('records-table')).toBeVisible();
  });

  test('全レベルの行が表示される', async ({ page }) => {
    await page.goto('/sansu-100/records');
    await expect(page.getByTestId('record-row-1')).toBeVisible();
    await expect(page.getByTestId('record-row-10')).toBeVisible();
  });

  test('ホームの「ベスト記録」リンクが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await expect(page.getByTestId('records-link')).toBeVisible();
  });
});
