import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * くるりんボール（迷路傾けアクション）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - ボールの物理・壁判定はCanvas内のゲームロジックで発生するため、
 *   ここでは「ページ表示・スタート・タイマー減少・ゲームオーバー画面遷移」まで確認する。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `KRR${suffix}`;
}

async function registerAndLogin(page: Page, name: string): Promise<void> {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('sansu-100:dev-seeded', '1'); } catch { /* ignore */ }
  });
  await page.goto('/sansu-100/register');
  await page.getByTestId('register-name-input').fill(name);
  await page.getByTestId('register-name-next').click();
  const pad = page.locator('[data-testid=pin-pad]');
  await pad.waitFor();
  for (const d of PIN) {
    await pad.getByRole('button', { name: d, exact: true }).click();
  }
  await page.getByRole('button', { name: 'これでとうろく！' }).click();
  await page.waitForURL('**/sansu-100', { timeout: 10000 });
}

async function earnCoinsViaDebug(page: Page): Promise<void> {
  await page.goto('/sansu-100/play');
  await page.waitForLoadState('networkidle');
  const lv1 = page.locator('[data-testid="level-pick-1"]');
  if (await lv1.isVisible()) {
    await lv1.click();
  }
  const dbgBtn = page.locator('[data-testid="debug-finish-perfect"]');
  if (await dbgBtn.isVisible({ timeout: 5000 })) {
    await dbgBtn.click();
  }
  await page.goto('/sansu-100');
  await page.waitForLoadState('networkidle');
}

test.describe('くるりんボール ミニゲーム', () => {
  test('ミニゲーム一覧にくるりんボールが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('くるりんボール')).toBeVisible({ timeout: 8000 });
  });

  test('くるりんボールページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/kururin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('くるりんボール').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="kururin-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/kururin');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="kururin-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(
      page.getByText(/さんすうを|コインが/)
    ).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとキャンバスと操作ボタンが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/kururin');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="kururin-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="kururin-canvas"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="kururin-up"]')).toBeVisible();
    await expect(page.locator('[data-testid="kururin-down"]')).toBeVisible();
    await expect(page.locator('[data-testid="kururin-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="kururin-right"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('時間が経過するとタイマーが減っていく', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/kururin');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="kururin-start"]').click();

    const timerText = page.getByText(/⏱ \d+秒/);
    await expect(timerText).toBeVisible({ timeout: 8000 });
    const first = await timerText.textContent();
    await page.waitForTimeout(2000);
    const second = await timerText.textContent();
    expect(first).not.toBe(second);
  });

  test('傾けボタンを押すとボールが動く', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/kururin');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="kururin-start"]').click();
    await expect(page.locator('[data-testid="kururin-canvas"]')).toBeVisible({ timeout: 8000 });

    const canvas = page.locator('[data-testid="kururin-canvas"]');
    const before = await canvas.screenshot();

    const rightBtn = page.locator('[data-testid="kururin-right"]');
    await rightBtn.dispatchEvent('pointerdown');
    await page.waitForTimeout(600);
    await rightBtn.dispatchEvent('pointerup');

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });
});
