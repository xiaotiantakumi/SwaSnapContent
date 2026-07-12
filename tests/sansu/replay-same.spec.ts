import { expect, test } from '@playwright/test';

test.describe('同じレベル直リプレイ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-replay-user',
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
        coins: 50,
        minigameScores: {},
        minigameCredits: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(user.id));
      // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
      // 上書きされる競合を防ぐ
      sessionStorage.setItem('sansu-100:dev-seeded', '1');
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
    // ログインしているので、レベル選択（「どの れんしゅう？」画面）をスキップして
    // 練習が直接始まることを確認する
    await expect(page.getByText('どの れんしゅう？')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('main')).toBeVisible();
  });
});
