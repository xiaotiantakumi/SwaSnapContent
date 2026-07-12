import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `DCH${suffix}`;
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

test.describe('今日のチャレンジ', () => {
  test('ログイン後トップページに今日のチャレンジカードが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await expect(page.locator('[data-testid="daily-challenge-card"]')).toBeVisible({ timeout: 8000 });
  });

  test('チャレンジカードに「きょうのチャレンジ」テキストが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await expect(page.getByText('きょうのチャレンジ')).toBeVisible({ timeout: 8000 });
  });

  test('未クリア時は「チャレンジする」ボタンが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await expect(page.locator('[data-testid="daily-challenge-btn"]')).toBeVisible({ timeout: 8000 });
  });

  test('チャレンジボタンをクリックすると ?daily=1 の play ページへ遷移する', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    const btn = page.locator('[data-testid="daily-challenge-btn"]');
    await btn.waitFor({ timeout: 8000 });
    await btn.click();
    await expect(page).toHaveURL(/\/sansu-100\/play.*daily=1/, { timeout: 8000 });
  });

  test('+50pt ボーナス表示がある', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await expect(page.getByText('+50pt')).toBeVisible({ timeout: 8000 });
  });
});
