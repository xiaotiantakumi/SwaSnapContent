import { expect, test } from '@playwright/test';

test.describe('不正解ふりかえり', () => {
  test('不正解があれば結果画面にふりかえりセクションが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-wrong-user',
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
      // 不正解を含む結果をsessionStorageに設定
      const result = {
        session: {
          id: 'test-session-1',
          userId: 'test-wrong-user',
          userName: 'テスト',
          level: 1,
          operation: 'add',
          isDaily: false,
          startedAt: Date.now() - 60000,
          completedAt: Date.now(),
          durationMs: 60000,
          totalProblems: 5,
          correctCount: 3,
          pointsEarned: 10,
          newBadges: [],
        },
        newBadges: [],
        pointsEarned: 10,
        coinsEarned: 10,
        coinsAfter: 60,
        bestKey: 'lv1:add',
        previousBest: null,
        problems: [
          { a: 3, b: 2, op: 'add', answer: 5, userAnswer: 5, isCorrect: true, timeMs: 1000 },
          { a: 7, b: 4, op: 'add', answer: 11, userAnswer: 9, isCorrect: false, timeMs: 2000 },
          { a: 5, b: 3, op: 'add', answer: 8, userAnswer: 8, isCorrect: true, timeMs: 800 },
          { a: 9, b: 6, op: 'add', answer: 15, userAnswer: 14, isCorrect: false, timeMs: 3000 },
          { a: 2, b: 1, op: 'add', answer: 3, userAnswer: 3, isCorrect: true, timeMs: 500 },
        ],
      };
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(result));
    });
    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('wrong-review-section')).toBeVisible();
    await expect(page.getByText('まちがえた もんだい × 2')).toBeVisible();
  });

  test('全問正解の場合はふりかえりセクションが表示されない', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-perfect-user',
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
          id: 'test-session-2',
          userId: 'test-perfect-user',
          userName: 'テスト',
          level: 1,
          operation: 'add',
          isDaily: false,
          startedAt: Date.now() - 30000,
          completedAt: Date.now(),
          durationMs: 30000,
          totalProblems: 3,
          correctCount: 3,
          pointsEarned: 15,
          newBadges: [],
        },
        newBadges: [],
        pointsEarned: 15,
        coinsEarned: 15,
        coinsAfter: 65,
        bestKey: 'lv1:add',
        previousBest: null,
        problems: [
          { a: 1, b: 1, op: 'add', answer: 2, userAnswer: 2, isCorrect: true, timeMs: 500 },
          { a: 2, b: 2, op: 'add', answer: 4, userAnswer: 4, isCorrect: true, timeMs: 500 },
          { a: 3, b: 3, op: 'add', answer: 6, userAnswer: 6, isCorrect: true, timeMs: 500 },
        ],
      };
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(result));
    });
    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('wrong-review-section')).not.toBeVisible();
  });
});
