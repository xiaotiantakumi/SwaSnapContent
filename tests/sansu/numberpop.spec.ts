import { expect, test } from '@playwright/test';

test.describe('かずならべ (NumberPop) ミニゲーム', () => {
  test('イントロ画面が表示される', async ({ page }) => {
    await page.goto('/sansu-100/minigame/numberpop');
    await expect(page.getByText('🔢 かずならべ')).toBeVisible();
    await expect(page.getByTestId('start-btn')).toBeVisible();
  });

  test('コイン残高が表示される', async ({ page }) => {
    await page.goto('/sansu-100/minigame/numberpop');
    await expect(page.getByTestId('coin-balance')).toBeVisible();
  });

  test('あそびかたが表示される', async ({ page }) => {
    await page.goto('/sansu-100/minigame/numberpop');
    await expect(page.getByText('ちいさい じゅんに タップ！')).toBeVisible();
  });

  test('ミニゲームページからリンクがある', async ({ page }) => {
    await page.goto('/sansu-100/minigame');
    await expect(page.getByText('かずならべ')).toBeVisible();
  });
});
