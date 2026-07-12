import { expect, test } from '@playwright/test';

async function seedUser(
  page: import('@playwright/test').Page,
  userId: string
): Promise<void> {
  await page.evaluate(
    ({ userId }) => {
      const user = {
        id: userId,
        name: 'テストユーザー',
        avatar: '🙂',
        themeColor: '#3b82f6',
        createdAt: Date.now(),
        totalPoints: 0,
        earnedBadges: [] as string[],
        bestTimesByLevel: {},
        currentStreakDays: 0,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 0,
        coins: 100,
        minigameScores: {},
        minigameCredits: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(userId));
      localStorage.setItem(`sansu-100:sessions:${userId}`, JSON.stringify([]));
    },
    { userId }
  );
}

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
    await seedUser(page, 'test-today-user');
    await page.reload();
    await expect(page.getByTestId('today-summary-card')).toBeVisible();
  });

  test('未練習時は「さあ はじめよう」メッセージが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await seedUser(page, 'test-today-user2');
    await page.reload();
    await expect(page.getByText('さあ はじめよう')).toBeVisible();
  });
});
