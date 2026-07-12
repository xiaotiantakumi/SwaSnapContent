import { expect, test } from '@playwright/test';

type SeedUserOpts = {
  name: string;
  earnedBadges?: string[];
};

async function seedUser(
  page: import('@playwright/test').Page,
  userId: string,
  opts: SeedUserOpts,
  sessions: Record<string, unknown>[] = []
): Promise<void> {
  await page.goto('/sansu-100');
  await page.evaluate(
    ({ userId, opts, sessions }) => {
      const user = {
        id: userId,
        name: opts.name,
        avatar: '🙂',
        themeColor: '#3b82f6',
        createdAt: Date.now(),
        totalPoints: 0,
        earnedBadges: opts.earnedBadges ?? [],
        bestTimesByLevel: {},
        currentStreakDays: 0,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: sessions.length,
        coins: 100,
        minigameScores: {},
        minigameCredits: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(userId));
      localStorage.setItem(`sansu-100:sessions:${userId}`, JSON.stringify(sessions));
      // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
      // 上書きされる競合を防ぐ
      sessionStorage.setItem('sansu-100:dev-seeded', '1');
    },
    { userId, opts, sessions }
  );
}

function makeSessions(
  userId: string,
  count: number,
  overrides: Partial<{
    level: number;
    operation: string;
    durationMs: number;
    correctCount: number;
    totalProblems: number;
  }> = {}
): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s-${userId}-${i}`,
    userId,
    userName: 'テスト',
    level: overrides.level ?? 1,
    operation: overrides.operation ?? 'add',
    isDaily: false,
    isRetired: false,
    startedAt: Date.now() - i * 86400000 - (overrides.durationMs ?? 90000),
    completedAt: Date.now() - i * 86400000,
    durationMs: overrides.durationMs ?? 90000,
    totalProblems: overrides.totalProblems ?? 100,
    correctCount: overrides.correctCount ?? 100,
    pointsEarned: 10,
    newBadges: [] as string[],
  }));
}

test.describe('プロフィールページ', () => {
  test('未ログインはホームにリダイレクトされる', async ({ page }) => {
    await page.goto('/sansu-100/profile');
    await expect(page).toHaveURL(/sansu-100\/?$/);
  });

  test('ホームのナビグリッドにプロフィールリンクが表示される', async ({ page }) => {
    await seedUser(page, 'test-profile-user', { name: 'プロフィールくん' });
    await page.reload();
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible({ timeout: 5000 });
  });

  test('プロフィールページのヘッダーとユーザー情報が表示される', async ({ page }) => {
    const userId = 'test-profile-user2';
    const sessions = makeSessions(userId, 5);
    await seedUser(page, userId, { name: 'テスト花子', earnedBadges: ['sessions_1', 'perfect_first'] }, sessions);

    await page.goto('/sansu-100/profile');
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="profile-header"]')).toContainText('テスト花子');
  });

  test('統計グリッドに累計回数と時間が表示される', async ({ page }) => {
    const userId = 'test-profile-user3';
    const sessions = makeSessions(userId, 5, {
      operation: 'mul',
      durationMs: 60000,
      correctCount: 80,
    });
    await seedUser(page, userId, { name: 'テスト太郎' }, sessions);

    await page.goto('/sansu-100/profile');
    const stats = page.locator('[data-testid="profile-stats"]');
    await expect(stats).toBeVisible({ timeout: 8000 });
    await expect(stats).toContainText('5回');
    await expect(stats).toContainText('かけ算');
  });

  test('履歴ページへのリンクが存在する', async ({ page }) => {
    await seedUser(page, 'test-profile-user4', { name: 'テスト次郎', earnedBadges: ['sessions_1'] });

    await page.goto('/sansu-100/profile');
    await expect(page.locator('[data-testid="profile-history-link"]')).toBeVisible({ timeout: 8000 });
  });
});
