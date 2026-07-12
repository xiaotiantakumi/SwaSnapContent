import { expect, test } from '@playwright/test';

test.describe('レベル選択 — 自己ベストタイム表示', () => {
  test('記録がないときはベストタイムが表示されない', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-best-user1';
      const user = {
        id: userId,
        name: 'テストくん',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 0,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
        bestTimesByLevel: {},
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テストくん' }])
      );
    });

    await page.goto('/sansu-100/play');
    await expect(page.locator('[data-testid="level-pick-1"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="best-time-1"]')).not.toBeVisible();
  });

  test('記録があるレベルにはベストタイムが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-best-user2';
      const user = {
        id: userId,
        name: 'テスト花子',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 5,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
        // Lv1のベストタイムが90秒
        bestTimesByLevel: { 'lv1:add': 90000 },
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テスト花子' }])
      );
    });

    await page.goto('/sansu-100/play');
    const bestEl = page.locator('[data-testid="best-time-1"]');
    await expect(bestEl).toBeVisible({ timeout: 5000 });
    await expect(bestEl).toContainText('ベスト:');
    await expect(bestEl).toContainText('1:30');
  });

  test('記録のないレベルには表示されず、記録のあるレベルにのみ表示', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-best-user3';
      const user = {
        id: userId,
        name: 'テスト次郎',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 2,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
        bestTimesByLevel: { 'lv2:add': 120000 },
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テスト次郎' }])
      );
    });

    await page.goto('/sansu-100/play');
    // Lv2には表示
    await expect(page.locator('[data-testid="best-time-2"]')).toBeVisible({ timeout: 5000 });
    // Lv1には表示されない
    await expect(page.locator('[data-testid="best-time-1"]')).not.toBeVisible();
  });
});
