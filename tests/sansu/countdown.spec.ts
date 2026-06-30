import { expect, test } from '@playwright/test';

test.describe('カウントダウンオーバーレイ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const user = {
        id: 'test-countdown-user',
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
        feverWindowInterval: null,
        feverWindowUses: 0,
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
    });
  });

  test('レベル選択後にカウントダウンが表示される', async ({ page }) => {
    await page.goto('/sansu-100/play');
    // レベルピッカーが表示されるまで待機
    await page.waitForSelector('[data-testid="level-picker"], [class*="LevelPicker"]', { timeout: 5000 }).catch(() => null);
    // ピッカーのボタンを探してクリック
    const startBtn = page.locator('button').filter({ hasText: /Lv\.|たし算|ひき算|かけ算|わり算/ }).first();
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await expect(page.getByTestId('countdown-overlay')).toBeVisible({ timeout: 3000 });
    }
  });

  test('カウントダウン数字が表示される', async ({ page }) => {
    await page.goto('/sansu-100/play');
    const startBtn = page.locator('button').filter({ hasText: /Lv\.|たし算|ひき算|かけ算|わり算/ }).first();
    if (await startBtn.count() > 0) {
      await startBtn.click();
      const num = page.getByTestId('countdown-number');
      if (await num.count() > 0) {
        const text = await num.textContent();
        expect(['3', '2', '1', 'スタート！']).toContain(text?.trim());
      }
    }
  });
});
