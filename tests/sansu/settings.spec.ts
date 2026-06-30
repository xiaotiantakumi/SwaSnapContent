import { expect, test } from '@playwright/test';

const loginUser = async (page: import('@playwright/test').Page) => {
  await page.goto('/sansu-100');
  await page.evaluate(() => {
    const user = {
      id: 'test-settings-user',
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
    };
    localStorage.setItem('sansu_current_user', JSON.stringify(user));
  });
  await page.reload();
};

test.describe('設定ページ', () => {
  test('ホームに設定リンクが表示される', async ({ page }) => {
    await loginUser(page);
    await expect(page.getByTestId('settings-link')).toBeVisible();
  });

  test('設定ページが表示される', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sansu-100/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();
  });

  test('サウンドトグルが表示される', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sansu-100/settings');
    await expect(page.getByTestId('sound-toggle')).toBeVisible();
  });

  test('サウンドトグルをクリックで切り替えできる', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sansu-100/settings');
    const toggle = page.getByTestId('sound-toggle');
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    const after = await toggle.getAttribute('aria-checked');
    expect(before).not.toBe(after);
  });

  test('キーパッドモード選択が表示される', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sansu-100/settings');
    await expect(page.getByTestId('keypad-mode-select')).toBeVisible();
  });
});
