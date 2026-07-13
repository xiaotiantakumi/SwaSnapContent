import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * ストリークカード（連続学習日数）のE2Eテスト。
 * - ログイン後のトップページにストリークカードが表示されること
 * - 週間カレンダーが7日分表示されること
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `STK${suffix}`;
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

test.describe('ストリークカード', () => {
  test('ログイン後トップページにストリークカードが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.waitForURL('**/sansu-100', { timeout: 10000 });
    await expect(page.locator('[data-testid="streak-card"]')).toBeVisible({ timeout: 8000 });
  });

  test('ストリークカードに週間カレンダー（7日分）が表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.waitForURL('**/sansu-100', { timeout: 10000 });
    // カレンダーエリアが表示される
    const calendar = page.getByLabel('れんしゅうカレンダー');
    await expect(calendar).toBeVisible({ timeout: 8000 });
    // 7つの日付セルが表示される
    const cells = calendar.locator('div');
    await expect(cells).toHaveCount(7);
  });

  test('新規ユーザーは「きょうから はじめよう」が表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.waitForURL('**/sansu-100', { timeout: 10000 });
    await expect(page.getByText('きょうから はじめよう')).toBeVisible({ timeout: 8000 });
  });

  test('ストリークカードに「きょうは まだ」が初期表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.waitForURL('**/sansu-100', { timeout: 10000 });
    await expect(page.getByText('きょうは まだ')).toBeVisible({ timeout: 8000 });
  });
});
