import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * ひとふでライン（一筆書きパズル）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - レベル1は花びら2枚（ハブ+4頂点、6本の辺）の決定的な図形なので、
 *   実際になぞりきってレベルアップすることまで確認できる。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `HTF${suffix}`;
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

test.describe('ひとふでライン ミニゲーム', () => {
  test('ミニゲーム一覧にひとふでラインが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ひとふでライン')).toBeVisible({ timeout: 8000 });
  });

  test('ひとふでラインページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/hitofude');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ひとふでライン').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="hitofude-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/hitofude');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="hitofude-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(
      page.getByText(/さんすうを|コインが/)
    ).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとノードと辺が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/hitofude');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="hitofude-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="hitofude-svg"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="hitofude-node-0"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('レベル1（花びら2枚）を実際になぞりきるとレベル2へ進む', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/hitofude');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="hitofude-start"]').click();
    await expect(page.locator('[data-testid="hitofude-svg"]')).toBeVisible({ timeout: 8000 });

    // レベル1は petalsForLevel(1)=2 枚の花びら。ノードIDは 0(ハブ), 1,2(花びら0), 3,4(花びら1)。
    // 一筆書き経路: 0→1→2→0→3→4→0 で全6辺をなぞりきれる。
    const order = [0, 1, 2, 0, 3, 4, 0];
    for (const nodeId of order) {
      await page.locator(`[data-testid="hitofude-node-${nodeId}"]`).click();
      await page.waitForTimeout(150);
    }

    await expect(page.getByText('レベル 2')).toBeVisible({ timeout: 3000 });
  });
});
