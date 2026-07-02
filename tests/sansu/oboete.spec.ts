import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * おぼえてタッチ（サイモンセイズ風記憶ゲーム）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `OBT${suffix}`;
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

test.describe('おぼえてタッチ ミニゲーム', () => {
  test('ミニゲーム一覧におぼえてタッチが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('おぼえてタッチ')).toBeVisible({ timeout: 8000 });
  });

  test('おぼえてタッチページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/oboete');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('おぼえてタッチ').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="oboete-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/oboete');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="oboete-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(
      page.getByText(/さんすうを|コインが/)
    ).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとパッドが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/oboete');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="oboete-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    // playing フェーズ: 4色パッドが表示される
    await expect(page.locator('[data-testid="oboete-pad-0"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="oboete-pad-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="oboete-pad-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="oboete-pad-3"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('まちがえたパッドをタップするとゲームオーバーになる', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/oboete');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="oboete-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    // 毎ラウンド、入力フェーズになったら常にパッド0だけをタップし続ける。
    // 正解のシーケンスはランダムなので、ラウンドを重ねるたびにパッド0が
    // 正解する確率は 1/4 ずつ下がっていき、数ラウンド以内にほぼ確実に不正解＝
    // ゲームオーバー（ゲーム画面が終了画面に切り替わる）へ到達する（1回でハズレる確率は75%）。
    const finalScore = page.getByTestId('oboete-final-score');
    const status = page.getByTestId('oboete-status');
    let clicks = 0;
    for (let poll = 0; poll < 60 && clicks < 15; poll++) {
      if (await finalScore.isVisible().catch(() => false)) break;
      const text = await status.textContent().catch(() => null);
      if (text === 'じゅんばん どおりに タッチ！') {
        await page.locator('[data-testid="oboete-pad-0"]').click();
        clicks++;
        await page.waitForTimeout(250);
      } else {
        await page.waitForTimeout(200);
      }
    }

    await expect(finalScore).toBeVisible({ timeout: 8000 });
  });
});
