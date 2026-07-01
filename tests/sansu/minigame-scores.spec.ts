import { expect, test } from '@playwright/test';

test.describe('ミニゲームマイベストスコア', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-scores-user',
        name: 'テスト',
        coins: 100,
        earnedBadges: [],
        minigameScores: { snake: 150, runner: 80 },
        minigameCredits: 3,
        bestTimesByLevel: {},
        totalSessions: 5,
        totalPoints: 50,
        currentStreakDays: 1,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
    });
  });

  test('スコア一覧ページが表示される', async ({ page }) => {
    await page.goto('/sansu-100/minigame/scores');
    await expect(page.getByTestId('scores-list')).toBeVisible();
  });

  test('ベストスコアが表示される', async ({ page }) => {
    await page.goto('/sansu-100/minigame/scores');
    await expect(page.getByTestId('score-row-snake')).toBeVisible();
    await expect(page.getByText('150')).toBeVisible();
  });

  test('未プレイは「まだ あそんでないよ」と表示される', async ({ page }) => {
    await page.goto('/sansu-100/minigame/scores');
    await expect(page.getByText('まだ あそんでないよ').first()).toBeVisible();
  });

  test('ミニゲームロビーにマイベストリンクがある', async ({ page }) => {
    await page.goto('/sansu-100/minigame');
    await expect(page.getByTestId('scores-link')).toBeVisible();
  });
});
