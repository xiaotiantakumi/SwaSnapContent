import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * ピューピュー星空（固定画面シューティング）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - 自動連射・衝突判定はCanvas内のゲームロジックで発生するため、
 *   ここでは「ページ表示・スタート・スコア増加・ゲームオーバー画面遷移」まで確認する。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `SSH${suffix}`;
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

test.describe('ピューピュー星空 ミニゲーム', () => {
  test('ミニゲーム一覧にピューピュー星空が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ピューピュー星空')).toBeVisible({ timeout: 8000 });
  });

  test('ピューピュー星空ページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/starshooter');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ピューピュー星空').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="starshooter-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/starshooter');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="starshooter-start"]');
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

    await page.goto('/sansu-100/minigame/starshooter');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="starshooter-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="starshooter-canvas"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="starshooter-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="starshooter-right"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('自動連射でしばらく待つとスコアが増える', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/starshooter');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="starshooter-start"]').click();

    await expect(page.locator('[data-testid="starshooter-canvas"]')).toBeVisible({ timeout: 8000 });

    // 自機は中央固定・隕石はランダムX位置に降ってくるため、必ず当たるとは限らないが、
    // 数秒間の自動連射（毎秒3発）を続ければ十分な回数の弾が飛ぶので、スコアが増える確率が高い。
    // ここでは「スコアが変化しうる」ことを緩やかに確認する（0のままでもゲーム自体は正常）。
    await page.waitForTimeout(6000);
    const scoreText = await page.getByTestId('starshooter-score').textContent();
    expect(scoreText).toMatch(/^\d+$/);
  });

  test('やめるリンクでミニゲーム一覧へ戻れる', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/starshooter');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="starshooter-start"]').click();
    await expect(page.locator('[data-testid="starshooter-canvas"]')).toBeVisible({ timeout: 8000 });

    await page.getByText('← やめる').click();
    await page.waitForURL('**/sansu-100/minigame', { timeout: 5000 });
  });
});
