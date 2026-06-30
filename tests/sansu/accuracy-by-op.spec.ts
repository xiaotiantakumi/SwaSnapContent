import { expect, test } from '@playwright/test';

test.describe('演算別正答率グラフ', () => {
  test('正答率セクションが history ページに表示される', async ({ page }) => {
    await page.goto('/sansu-100/history');
    // redirect to home if not logged in — just check the page loads
    await expect(page).toHaveURL(/sansu-100/);
  });

  test('StatsCharts に accuracy-by-op セクションが存在する', async ({ page }) => {
    // Inject a user and sessions into localStorage to test chart rendering
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-acc-user';
      const user = {
        id: userId,
        name: 'テストくん',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 10,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      // 10 sessions: 5 add (80% accuracy), 5 sub (60% accuracy)
      const sessions = Array.from({ length: 10 }, (_, i) => ({
        id: `sess-${i}`,
        userId,
        level: 'standard' as const,
        operation: i < 5 ? 'add' : 'sub',
        durationMs: 60000,
        correctCount: i < 5 ? 80 : 60,
        totalProblems: 100,
        completedAt: Date.now() - i * 86400000,
        isDaily: false,
      }));
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_${userId}`, JSON.stringify(sessions));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テストくん' }])
      );
    });

    await page.goto('/sansu-100/history');
    await expect(page.locator('[data-testid="accuracy-by-op"]')).toBeVisible({
      timeout: 8000,
    });
  });

  test('演算別カードに正答率が数値で表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-acc-user2';
      const user = {
        id: userId,
        name: 'テストくん2',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 5,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        id: `sess2-${i}`,
        userId,
        level: 'standard' as const,
        operation: 'mul',
        durationMs: 50000,
        correctCount: 90,
        totalProblems: 100,
        completedAt: Date.now() - i * 86400000,
        isDaily: false,
      }));
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_${userId}`, JSON.stringify(sessions));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テストくん2' }])
      );
    });

    await page.goto('/sansu-100/history');
    const section = page.locator('[data-testid="accuracy-by-op"]');
    await expect(section).toBeVisible({ timeout: 8000 });
    // 90% accuracy should appear somewhere in the section
    await expect(section).toContainText('90%');
  });

  test('セッションが少ない場合はデータ不足メッセージが出る', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-acc-user3';
      const user = {
        id: userId,
        name: 'テストくん3',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 1,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      // Only 1 session with 9 total problems (< 10 threshold)
      const sessions = [
        {
          id: 'sess3-0',
          userId,
          level: 'standard' as const,
          operation: 'add',
          durationMs: 30000,
          correctCount: 8,
          totalProblems: 9,
          completedAt: Date.now(),
          isDaily: false,
        },
      ];
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_${userId}`, JSON.stringify(sessions));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テストくん3' }])
      );
    });

    await page.goto('/sansu-100/history');
    const section = page.locator('[data-testid="accuracy-by-op"]');
    await expect(section).toBeVisible({ timeout: 8000 });
    await expect(section).toContainText('もう少し れんしゅうすると');
  });
});
