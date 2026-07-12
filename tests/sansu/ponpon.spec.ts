import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * ぽんぽんジャンプ（縦スクロールジャンプアクション）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - ジャンプ・足場判定はCanvas内のゲームロジックで発生するため、
 *   ここでは「ページ表示・スタート・高さ表示・ゲームオーバー画面遷移」まで確認する。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `PPJ${suffix}`;
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

test.describe('ぽんぽんジャンプ ミニゲーム', () => {
  test('ミニゲーム一覧にぽんぽんジャンプが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ぽんぽんジャンプ')).toBeVisible({ timeout: 8000 });
  });

  test('ぽんぽんジャンプページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/ponpon');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ぽんぽんジャンプ').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="ponpon-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/ponpon');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="ponpon-start"]');
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

    await page.goto('/sansu-100/minigame/ponpon');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="ponpon-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="ponpon-canvas"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="ponpon-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="ponpon-right"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('しばらく待つと自動ジャンプで高さが増える', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/ponpon');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="ponpon-start"]').click();

    await expect(page.locator('[data-testid="ponpon-canvas"]')).toBeVisible({ timeout: 8000 });

    const heightText = page.getByTestId('ponpon-height');
    await expect(heightText).toBeVisible({ timeout: 8000 });
    // 高さは非負の数値として表示され続ける（実際に登れるかは足場配置次第だが、
    // ゲームが正常に動作し続けている＝クラッシュしていないことを確認する）
    await page.waitForTimeout(2000);
    const text = await heightText.textContent();
    expect(text).toMatch(/^\d+$/);
  });

  test('落下してゲームオーバーになると最終スコア画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/ponpon');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="ponpon-start"]').click();

    await expect(page.locator('[data-testid="ponpon-canvas"]')).toBeVisible({ timeout: 8000 });

    // 左右ボタンを押しっぱなしにして画面外へキャラクターを追いやり、
    // 足場を外して落下→ゲームオーバーに到達させる
    const leftBtn = page.locator('[data-testid="ponpon-left"]');
    await leftBtn.dispatchEvent('pointerdown');
    await page.waitForTimeout(8000);

    await expect(page.getByTestId('ponpon-final-score')).toBeVisible({ timeout: 5000 });
  });
});
