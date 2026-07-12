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

async function seedUser(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/sansu-100');
  await page.evaluate(() => {
    const user = {
      id: 'test-user',
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
  });
}

test.describe('つぎのチャレンジ提案カード', () => {
  test('パーフェクト+速い→次レベル提案が表示される', async ({ page }) => {
    await seedUser(page);

    const result = makeResult({ previousBest: null });
    await page.evaluate((r) => {
      sessionStorage.setItem('sansu-100:last-result', JSON.stringify(r));
    }, result);

    await page.goto('/sansu-100/result');
    await expect(page.getByTestId('next-challenge-card')).toBeVisible();
    await expect(page.getByTestId('next-challenge-btn')).toBeVisible();
  });

  test('パーフェクトでない→もう1かいカードが表示される', async ({ page }) => {
    await seedUser(page);

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
    await seedUser(page);

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
