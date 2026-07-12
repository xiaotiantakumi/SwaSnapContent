import { expect, test } from '@playwright/test';

test.describe('カウントダウンオーバーレイ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-countdown-user',
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
        feverWindowInterval: null,
        feverWindowUses: 0,
      };
      localStorage.setItem('sansu-100:users', JSON.stringify([user]));
      localStorage.setItem('sansu-100:current-user', JSON.stringify(user.id));
      // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
      // 上書きされる競合を防ぐ
      sessionStorage.setItem('sansu-100:dev-seeded', '1');
    });
  });

  test('レベル選択後にカウントダウンが表示される', async ({ page }) => {
    await page.goto('/sansu-100/play');
    const startBtn = page.locator('button').filter({ hasText: /Lv\.|たし算|ひき算|かけ算|わり算/ }).first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();
    await expect(page.getByTestId('countdown-overlay')).toBeVisible({ timeout: 3000 });
  });

  test('カウントダウン数字が表示される', async ({ page }) => {
    await page.goto('/sansu-100/play');
    const startBtn = page.locator('button').filter({ hasText: /Lv\.|たし算|ひき算|かけ算|わり算/ }).first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();
    const num = page.getByTestId('countdown-number');
    await expect(num).toBeVisible({ timeout: 3000 });
    const text = await num.textContent();
    expect(['3', '2', '1', 'スタート！']).toContain(text?.trim());
  });
});
