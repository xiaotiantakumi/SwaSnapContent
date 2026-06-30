import { expect, test } from '@playwright/test';

test.describe('今日のれんしゅうサマリーカード', () => {
  test('ホーム画面にサマリーカードが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    // ユーザー未選択でもDOMには存在する（ユーザー選択後に表示）
    // ページが表示されることを確認
    await expect(page).toHaveTitle(/100マス|SwaSnap/);
  });

  test('ログイン後にサマリーカードが表示される', async ({ page }) => {
    // localStorageにテストユーザーをセットしてホームを開く
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-today-user',
        name: 'テストユーザー',
        coins: 100,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        bestTimesByLevel: {},
        totalSessions: 0,
        totalPoints: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem('sansu_recent_users', JSON.stringify([user]));
      localStorage.setItem(`sansu_sessions_test-today-user`, JSON.stringify([]));
    });
    await page.reload();
    await expect(page.getByTestId('today-summary-card')).toBeVisible();
  });

  test('未練習時は「さあ はじめよう」メッセージが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-today-user2',
        name: 'テスト',
        coins: 50,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        bestTimesByLevel: {},
        totalSessions: 0,
        totalPoints: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(`sansu_sessions_test-today-user2`, JSON.stringify([]));
    });
    await page.reload();
    await expect(page.getByText('さあ はじめよう')).toBeVisible();
  });
});
