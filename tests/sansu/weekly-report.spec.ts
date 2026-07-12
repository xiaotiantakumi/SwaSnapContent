import { expect, test } from '@playwright/test';

test.describe('今週のれんしゅうサマリー', () => {
  async function setupUser(
    page: Parameters<Parameters<typeof test>[1]>[0],
    userId: string,
    name: string,
    sessions: object[]
  ) {
    await page.goto('/sansu-100');
    await page.evaluate(
      ({ userId, name, sessions }) => {
        const user = {
          id: userId,
          name,
          avatar: '🙂',
          themeColor: '#3b82f6',
          createdAt: Date.now(),
          totalPoints: 0,
          earnedBadges: [] as string[],
          bestTimesByLevel: {},
          currentStreakDays: 0,
          lastPlayedDate: '',
          lastPlayedAt: 0,
          totalSessions: sessions.length,
          coins: 0,
          minigameScores: {},
          minigameCredits: 0,
        };
        localStorage.setItem('sansu-100:users', JSON.stringify([user]));
        localStorage.setItem('sansu-100:current-user', JSON.stringify(userId));
        localStorage.setItem(
          `sansu-100:sessions:${userId}`,
          JSON.stringify(sessions)
        );
        // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
        // 上書きされる競合を防ぐ
        sessionStorage.setItem('sansu-100:dev-seeded', '1');
      },
      { userId, name, sessions }
    );
  }

  test('週間サマリーセクションが history ページに表示される', async ({ page }) => {
    await setupUser(page, 'wk-user1', 'テストA', []);
    await page.goto('/sansu-100/history');
    await expect(page.locator('[data-testid="weekly-report"]')).toBeVisible({
      timeout: 8000,
    });
  });

  test('今週練習した日に ✓ マークが表示される', async ({ page }) => {
    // Use a session completed just now (within this week)
    const sessions = [
      {
        id: 'wk-s1',
        userId: 'wk-user2',
        level: 'standard',
        operation: 'add',
        durationMs: 90000,
        correctCount: 100,
        totalProblems: 100,
        completedAt: Date.now(),
        isDaily: false,
        isRetired: false,
        pointsEarned: 10,
      },
    ];
    await setupUser(page, 'wk-user2', 'テストB', sessions);
    await page.goto('/sansu-100/history');
    const report = page.locator('[data-testid="weekly-report"]');
    await expect(report).toBeVisible({ timeout: 8000 });
    // 今日の曜日に ✓ が表示されているはず
    await expect(report).toContainText('✓');
  });

  test('今週セッションなしのときは促進メッセージが表示される', async ({ page }) => {
    // セッションを先週のタイムスタンプにする（8日前）
    const sessions = [
      {
        id: 'wk-s2',
        userId: 'wk-user3',
        level: 'standard',
        operation: 'add',
        durationMs: 60000,
        correctCount: 100,
        totalProblems: 100,
        completedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        isDaily: false,
        isRetired: false,
        pointsEarned: 10,
      },
    ];
    await setupUser(page, 'wk-user3', 'テストC', sessions);
    await page.goto('/sansu-100/history');
    const report = page.locator('[data-testid="weekly-report"]');
    await expect(report).toBeVisible({ timeout: 8000 });
    await expect(report).toContainText('はじめよう');
  });

  test('今週の回数と累計時間が表示される', async ({ page }) => {
    const now = Date.now();
    const sessions = Array.from({ length: 3 }, (_, i) => ({
      id: `wk-s3-${i}`,
      userId: 'wk-user4',
      level: 'standard',
      operation: 'add',
      durationMs: 60000,
      correctCount: 100,
      totalProblems: 100,
      completedAt: now - i * 60 * 60 * 1000,
      isDaily: false,
      isRetired: false,
      pointsEarned: 10,
    }));
    await setupUser(page, 'wk-user4', 'テストD', sessions);
    await page.goto('/sansu-100/history');
    const report = page.locator('[data-testid="weekly-report"]');
    await expect(report).toBeVisible({ timeout: 8000 });
    await expect(report).toContainText('3');
  });
});
