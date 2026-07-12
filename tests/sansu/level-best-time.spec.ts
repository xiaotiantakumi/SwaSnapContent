import { expect, test } from '@playwright/test';

async function seedUser(
  page: import('@playwright/test').Page,
  userId: string,
  bestTimesByLevel: Record<string, number> = {}
): Promise<void> {
  await page.goto('/sansu-100');
  await page.evaluate(
    ({ userId, bestTimesByLevel }) => {
      const user = {
        id: userId,
        name: 'テストくん',
        avatar: '🙂',
        themeColor: '#3b82f6',
        createdAt: Date.now(),
        totalPoints: 0,
        earnedBadges: [] as string[],
        bestTimesByLevel,
        currentStreakDays: 0,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 0,
        coins: 0,
        minigameScores: {},
        minigameCredits: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(userId));
    },
    { userId, bestTimesByLevel }
  );
}

test.describe('レベル選択 — 自己ベストタイム表示', () => {
  test('記録がないときはベストタイムが表示されない', async ({ page }) => {
    await seedUser(page, 'test-best-user1');

    await page.goto('/sansu-100/play');
    await expect(page.locator('[data-testid="level-pick-1"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="best-time-1"]')).not.toBeVisible();
  });

  test('記録があるレベルにはベストタイムが表示される', async ({ page }) => {
    // Lv1のベストタイムが90秒
    await seedUser(page, 'test-best-user2', { 'lv1:add': 90000 });

    await page.goto('/sansu-100/play');
    const bestEl = page.locator('[data-testid="best-time-1"]');
    await expect(bestEl).toBeVisible({ timeout: 5000 });
    await expect(bestEl).toContainText('ベスト:');
    await expect(bestEl).toContainText('1:30');
  });

  test('記録のないレベルには表示されず、記録のあるレベルにのみ表示', async ({ page }) => {
    await seedUser(page, 'test-best-user3', { 'lv2:add': 120000 });

    await page.goto('/sansu-100/play');
    // Lv2には表示
    await expect(page.locator('[data-testid="best-time-2"]')).toBeVisible({ timeout: 5000 });
    // Lv1には表示されない
    await expect(page.locator('[data-testid="best-time-1"]')).not.toBeVisible();
  });
});
