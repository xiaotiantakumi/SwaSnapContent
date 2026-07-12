import { expect, test } from '@playwright/test';

async function seedUser(
  page: import('@playwright/test').Page,
  userId: string
): Promise<void> {
  await page.goto('/sansu-100');
  await page.evaluate(
    ({ userId }) => {
      const user = {
        id: userId,
        name: 'テスト',
        avatar: '🙂',
        themeColor: '#3b82f6',
        createdAt: Date.now(),
        totalPoints: 30,
        earnedBadges: [] as string[],
        bestTimesByLevel: {},
        currentStreakDays: 1,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 3,
        coins: 50,
        minigameScores: {},
        minigameCredits: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(userId));
      localStorage.setItem(`sansu-100:sessions:${userId}`, JSON.stringify([]));
      // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
      // 上書きされる競合を防ぐ
      sessionStorage.setItem('sansu-100:dev-seeded', '1');
    },
    { userId }
  );
}

test.describe('次に取れそうなバッジヒント', () => {
  test('ログイン後ホームにヒントが表示される', async ({ page }) => {
    await seedUser(page, 'test-badge-hint-user');
    await page.reload();
    await expect(page.getByTestId('next-badge-hint')).toBeVisible();
  });

  test('あと〇〇かい/日の文言が表示される', async ({ page }) => {
    await seedUser(page, 'test-badge-hint-user2');
    await page.reload();
    await expect(page.getByText(/あと/)).toBeVisible();
  });
});
