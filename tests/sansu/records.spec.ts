import { expect, test } from '@playwright/test';

async function seedUser(
  page: import('@playwright/test').Page,
  userId: string,
  bestTimesByLevel: Record<string, number> = {}
): Promise<void> {
  await page.goto('/sansu-100');
  await page.evaluate(
    ({ userId, bestTimesByLevel }) => {
      const now = Date.now();
      const user = {
        id: userId,
        name: 'テストユーザー',
        avatar: '🙂',
        themeColor: '#3b82f6',
        createdAt: now,
        totalPoints: 0,
        earnedBadges: [] as string[],
        bestTimesByLevel,
        currentStreakDays: 0,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 0,
        coins: 100,
        minigameScores: {},
        minigameCredits: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(userId));
    },
    { userId, bestTimesByLevel }
  );
}

test.describe('ベスト記録ページ', () => {
  test('記録ページが表示される', async ({ page }) => {
    await seedUser(page, 'test-records-user1');
    await page.goto('/sansu-100/records');
    await expect(page.getByText('🏆 ベスト記録')).toBeVisible();
  });

  test('記録テーブルが表示される', async ({ page }) => {
    await seedUser(page, 'test-records-user2');
    await page.goto('/sansu-100/records');
    await expect(page.getByTestId('records-table')).toBeVisible();
  });

  test('全レベルの行が表示される', async ({ page }) => {
    await seedUser(page, 'test-records-user3');
    await page.goto('/sansu-100/records');
    await expect(page.getByTestId('record-row-1')).toBeVisible();
    await expect(page.getByTestId('record-row-10')).toBeVisible();
  });

  test('記録があるレベルにはベストタイムが表示される', async ({ page }) => {
    await seedUser(page, 'test-records-user4', { 'lv1:add': 90000 });
    await page.goto('/sansu-100/records');
    const row = page.getByTestId('record-row-1');
    await expect(row).toContainText('1:30');
  });

  test('ホームの「ベスト記録」リンクが表示される', async ({ page }) => {
    await seedUser(page, 'test-records-user5');
    await page.goto('/sansu-100');
    await expect(page.getByTestId('records-link')).toBeVisible();
  });
});
