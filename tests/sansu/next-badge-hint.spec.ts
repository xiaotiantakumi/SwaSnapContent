import { expect, test } from '@playwright/test';

test.describe('次に取れそうなバッジヒント', () => {
  test('ログイン後ホームにヒントが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-badge-hint-user',
        name: 'テスト',
        coins: 50,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        bestTimesByLevel: {},
        totalSessions: 3,
        totalPoints: 30,
        currentStreakDays: 1,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_test-badge-hint-user`, JSON.stringify([]));
    });
    await page.reload();
    await expect(page.getByTestId('next-badge-hint')).toBeVisible();
  });

  test('あと〇〇かい/日の文言が表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-badge-hint-user2',
        name: 'テスト',
        coins: 50,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        bestTimesByLevel: {},
        totalSessions: 3,
        totalPoints: 30,
        currentStreakDays: 1,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_test-badge-hint-user2`, JSON.stringify([]));
    });
    await page.reload();
    await expect(page.getByText(/あと/)).toBeVisible();
  });
});
