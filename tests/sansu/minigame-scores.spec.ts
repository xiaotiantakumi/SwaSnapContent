import { expect, test } from '@playwright/test';

test.describe('ミニゲームマイベストスコア', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-scores-user',
        name: 'テスト',
        avatar: '🙂',
        themeColor: '#3b82f6',
        createdAt: Date.now(),
        totalPoints: 50,
        earnedBadges: [] as string[],
        bestTimesByLevel: {},
        currentStreakDays: 1,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 5,
        coins: 100,
        minigameScores: { snake: 150, runner: 80 },
        minigameCredits: 3,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(user.id));
      // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
      // 上書きされる競合を防ぐ
      sessionStorage.setItem('sansu-100:dev-seeded', '1');
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
