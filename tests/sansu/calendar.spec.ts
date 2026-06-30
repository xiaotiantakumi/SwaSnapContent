import { expect, test } from '@playwright/test';

test.describe('カレンダーヒートマップ', () => {
  test('履歴ページにカレンダーが表示される', async ({ page }) => {
    await page.goto('/sansu-100/history');
    await expect(page.getByTestId('calendar-heatmap')).toBeVisible();
  });

  test('今月のカレンダーが表示される', async ({ page }) => {
    await page.goto('/sansu-100/history');
    const now = new Date();
    const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    await expect(page.getByText(monthLabel)).toBeVisible();
  });

  test('曜日ヘッダーが表示される', async ({ page }) => {
    await page.goto('/sansu-100/history');
    await expect(page.getByText('日')).toBeVisible();
    await expect(page.getByText('月')).toBeVisible();
    await expect(page.getByText('土')).toBeVisible();
  });
});
