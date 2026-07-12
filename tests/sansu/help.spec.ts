import { expect, test } from '@playwright/test';

test.describe('あそびかたページ', () => {
  test('ヘルプページが表示される', async ({ page }) => {
    await page.goto('/sansu-100/help');
    await expect(page.locator('[data-testid="help-sections"]')).toBeVisible({ timeout: 5000 });
  });

  test('すべてのセクションが存在する', async ({ page }) => {
    await page.goto('/sansu-100/help');
    const sections = ['coins', 'spend', 'badges', 'minigame', 'daily', 'tips'];
    for (const id of sections) {
      await expect(page.locator(`[data-testid="help-section-${id}"]`)).toBeVisible();
    }
  });

  test('アコーディオンが開閉できる', async ({ page }) => {
    await page.goto('/sansu-100/help');
    const btn = page.locator('[data-testid="help-section-coins"]');
    await expect(btn).toBeVisible({ timeout: 5000 });
    // Initially closed — content not visible
    await expect(page.locator('text=たし算をクリアすると')).not.toBeVisible();
    // Click to open
    await btn.click();
    await expect(page.locator('text=たし算をクリアすると')).toBeVisible();
    // Click again to close
    await btn.click();
    await expect(page.locator('text=たし算をクリアすると')).not.toBeVisible();
  });

  test('ホームにログイン後「あそびかた」リンクが表示される', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'help-test-user';
      const user = {
        id: userId,
        name: 'ヘルプくん',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 0,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'ヘルプくん' }])
      );
    });
    await page.reload();
    await expect(page.locator('[data-testid="help-link"]')).toBeVisible({ timeout: 5000 });
  });

  test('「あそびかた」リンクをクリックするとヘルプページへ遷移', async ({ page }) => {
    await page.goto('/sansu-100');
    await page.evaluate(() => {
      const userId = 'help-test-user2';
      const user = {
        id: userId,
        name: 'ヘルプくん2',
        pinHash: '',
        createdAt: Date.now(),
        totalSessions: 0,
        coins: 0,
        earnedBadges: [],
        minigameScores: {},
        minigameCredits: 0,
        avatarConfig: null,
        ownedItems: [],
      };
      localStorage.setItem('sansu_current_user', JSON.stringify(user));
      localStorage.setItem(
        'sansu_recent_users',
        JSON.stringify([{ id: userId, name: 'ヘルプくん2' }])
      );
    });
    await page.reload();
    await page.locator('[data-testid="help-link"]').click();
    await expect(page).toHaveURL(/sansu-100\/help/);
    await expect(page.locator('[data-testid="help-sections"]')).toBeVisible({ timeout: 5000 });
  });
});
