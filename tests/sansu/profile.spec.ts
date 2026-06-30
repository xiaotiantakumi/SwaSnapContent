import { expect, test } from '@playwright/test';

test.describe('プロフィールページ', () => {
  test('未ログインはホームにリダイレクトされる', async ({ page }) => {
    await page.goto('/sansu-100/profile');
    await expect(page).toHaveURL(/sansu-100\/?$/);
  });

  test('ホームのナビグリッドにプロフィールリンクが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-profile-user';
      const user = {
        id: userId,
        name: 'プロフィールくん',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 3,
        coins: 100,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'プロフィールくん' }])
      );
    });
    await page.reload();
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible({ timeout: 5000 });
  });

  test('プロフィールページのヘッダーとユーザー情報が表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-profile-user2';
      const user = {
        id: userId,
        name: 'テスト花子',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 10,
        coins: 200,
        earnedBadges: ['sessions_1', 'perfect_first'],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        id: `s-${i}`,
        userId,
        level: 'standard' as const,
        operation: 'add',
        durationMs: 90000 + i * 10000,
        correctCount: 100,
        totalProblems: 100,
        completedAt: Date.now() - i * 86400000,
        isDaily: false,
      }));
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_${userId}`, JSON.stringify(sessions));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テスト花子' }])
      );
    });

    await page.goto('/sansu-100/profile');
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="profile-header"]')).toContainText('テスト花子');
  });

  test('統計グリッドに累計回数と時間が表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-profile-user3';
      const user = {
        id: userId,
        name: 'テスト太郎',
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
        id: `s3-${i}`,
        userId,
        level: 'standard' as const,
        operation: 'mul',
        durationMs: 60000,
        correctCount: 80,
        totalProblems: 100,
        completedAt: Date.now() - i * 86400000,
        isDaily: false,
      }));
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_${userId}`, JSON.stringify(sessions));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テスト太郎' }])
      );
    });

    await page.goto('/sansu-100/profile');
    const stats = page.locator('[data-testid="profile-stats"]');
    await expect(stats).toBeVisible({ timeout: 8000 });
    await expect(stats).toContainText('5回');
    await expect(stats).toContainText('かけ算');
  });

  test('履歴ページへのリンクが存在する', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'test-profile-user4';
      const user = {
        id: userId,
        name: 'テスト次郎',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 2,
        coins: 0,
        earnedBadges: ['sessions_1'],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'テスト次郎' }])
      );
    });

    await page.goto('/sansu-100/profile');
    await expect(page.locator('[data-testid="profile-history-link"]')).toBeVisible({ timeout: 8000 });
  });
});
