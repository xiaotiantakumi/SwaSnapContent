import { expect, test } from '@playwright/test';

const makeResult = (overrides: Record<string, unknown> = {}) => ({
  userId: 'test-user',
  session: {
    id: 'sess-1',
    userId: 'test-user',
    level: 1,
    operation: 'add',
    durationMs: 90000,
    correctCount: 100,
    totalProblems: 100,
    completedAt: Date.now(),
    isDaily: false,
    isRetired: false,
    pointsEarned: 10,
  },
  newBadges: [],
  pointsEarned: 10,
  coinsEarned: 10,
  coinBreakdown: [],
  coinsAfter: 60,
  bestKey: 'lv1:add',
  previousBest: null,
  feverEligible: false,
  ...overrides,
});

test.describe('つぎのチャレンジ提案カード', () => {
  test('パーフェクト+速い→次レベル提案が表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-user',
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
    });

    const result = makeResult({ previousBest: null });
    await page.evaluate((r) => {
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(r));
    }, result);

    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('next-challenge-card')).toBeVisible();
    await expect(page.getByTestId('next-challenge-btn')).toBeVisible();
  });

  test('パーフェクトでない→もう1かいカードが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-user',
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
    });

    const result = makeResult({
      session: {
        id: 'sess-2',
        userId: 'test-user',
        level: 1,
        operation: 'add',
        durationMs: 90000,
        correctCount: 80,
        totalProblems: 100,
        completedAt: Date.now(),
        isDaily: false,
        isRetired: false,
        pointsEarned: 10,
      },
    });
    await page.evaluate((r) => {
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(r));
    }, result);

    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('next-challenge-card')).toBeVisible();
    await expect(page.getByText(/もう1かい れんしゅうしよう/)).toBeVisible();
  });

  test('次レベルボタンのhrefに?level=が含まれる', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-user',
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
    });

    const result = makeResult({ previousBest: null });
    await page.evaluate((r) => {
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(r));
    }, result);

    await page.goto('/sansu-100/result');
    const btn = page.getByTestId('next-challenge-btn');
    await expect(btn).toBeVisible();
    const href = await btn.getAttribute('href');
    expect(href).toContain('level=');
  });
});
