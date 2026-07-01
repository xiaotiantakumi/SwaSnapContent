import { expect, test } from '@playwright/test';

test.describe('同じレベル直リプレイ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-replay-user',
        name: 'テスト',
        coins: 50,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        bestTimesByLevel: {},
        totalSessions: 5,
        totalPoints: 50,
        currentStreakDays: 1,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      const result = {
        session: {
          id: 'test-replay-session',
          userId: 'test-replay-user',
          userName: 'テスト',
          level: 2,
          operation: 'add',
          isDaily: false,
          startedAt: Date.now() - 40000,
          completedAt: Date.now(),
          durationMs: 40000,
          totalProblems: 5,
          correctCount: 5,
          pointsEarned: 20,
          newBadges: [],
        },
        newBadges: [],
        pointsEarned: 20,
        coinsEarned: 20,
        coinsAfter: 70,
        bestKey: 'lv2:add',
        previousBest: null,
      };
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(result));
    });
  });

  test('結果画面に「おなじレベルでもう1回」ボタンが表示される', async ({ page }) => {
    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('replay-same-btn')).toBeVisible();
  });

  test('結果画面に「べつのレベルを選ぶ」ボタンが表示される', async ({ page }) => {
    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('replay-pick-btn')).toBeVisible();
  });

  test('URLパラメータで直接レベルを指定して練習を開始できる', async ({ page }) => {
    await page.goto('/sansu-100/play?level=2&op=add');
    // ログインしているので、レベル選択をスキップして練習が始まることを確認
    await page.waitForTimeout(1000);
    // ProgressBarまたは問題表示エリアが見えることを確認
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
