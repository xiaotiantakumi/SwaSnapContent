import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `DRM${suffix}`;
}

async function enterPin(page: Page, pin: string, confirmLabel: string) {
  const pad = page.locator('[data-testid=pin-pad]');
  await pad.waitFor();
  for (const d of pin) {
    await pad.getByRole('button', { name: d, exact: true }).click();
  }
  await page.getByRole('button', { name: confirmLabel }).click();
}

async function registerAndLogin(page: Page, name: string): Promise<void> {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('sansu-100:dev-seeded', '1'); } catch { /* ignore */ }
  });
  await page.goto('/sansu-100');
  const regBtn = page.getByRole('button', { name: /あたらしく はじめる|新しく|登録/ });
  await regBtn.waitFor({ timeout: 8000 });
  await regBtn.click();
  const nameInput = page.getByPlaceholder(/なまえ|名前/);
  await nameInput.fill(name);
  await page.getByRole('button', { name: /つぎへ|次へ|次/ }).click();
  await enterPin(page, PIN, '決定');
  await enterPin(page, PIN, '確認');
  await page.waitForURL('**/sansu-100', { timeout: 10000 });
}

async function earnCoinsViaDebug(page: Page): Promise<void> {
  await page.goto('/sansu-100/play');
  await page.waitForLoadState('networkidle');
  const lv1 = page.locator('[data-testid="level-pick-1"]');
  if (await lv1.isVisible()) await lv1.click();
  const dbgBtn = page.locator('[data-testid="debug-finish-perfect"]');
  if (await dbgBtn.isVisible({ timeout: 5000 })) await dbgBtn.click();
  await page.goto('/sansu-100');
  await page.waitForLoadState('networkidle');
}

test.describe('だるまさんがころんだ ミニゲーム', () => {
  test('ミニゲーム一覧にだるまさんがころんだが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('だるまさんがころんだ')).toBeVisible({ timeout: 8000 });
  });

  test('だるまページにアクセスすると intro 画面が表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('だるまさんがころんだ').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="daruma-start"]')).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="daruma-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(page.getByText(/さんすうを|コインが/)).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとキャンバスが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await earnCoinsViaDebug(page);
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="daruma-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('playing 中にタップボタンが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await earnCoinsViaDebug(page);
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="daruma-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(page.getByRole('button', { name: /タップ|とまれ/ })).toBeVisible({ timeout: 8000 });
  });
});
