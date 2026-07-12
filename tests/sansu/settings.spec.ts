import { expect, test } from '@playwright/test';

const loginUser = async (page: import('@playwright/test').Page) => {
  await page.goto('/sansu-100');
  await page.evaluate(() => {
    const user = {
      id: 'test-settings-user',
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
    };
    localStorage.setItem('sansu-100:users', JSON.stringify([user]));
    localStorage.setItem('sansu-100:current-user', JSON.stringify(user.id));
    // dev-seed(たろう等の自動ユーザー作成)を止め、seed直後にcurrentUserが
    // 上書きされる競合を防ぐ
    sessionStorage.setItem('sansu-100:dev-seeded', '1');
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
