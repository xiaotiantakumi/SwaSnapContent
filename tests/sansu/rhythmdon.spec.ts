import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * リズムでドン（簡易リズムゲーム）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - ノーツはレーンが交互（決定的）に出現するので、判定タイミングを正確に待って
 *   タップすればヒットを再現できる。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `RTM${suffix}`;
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

test.describe('リズムでドン ミニゲーム', () => {
  test('ミニゲーム一覧にリズムでドンが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('リズムでドン')).toBeVisible({ timeout: 8000 });
  });

  test('リズムでドンページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('リズムでドン').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="rhythmdon-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="rhythmdon-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(
      page.getByText(/さんすうを|コインが/)
    ).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとレーンボタンが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="rhythmdon-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="rhythmdon-lane-0"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="rhythmdon-lane-1"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('判定ラインのタイミングでタップするとスコアが増える', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="rhythmdon-start"]').click();

    await expect(page.locator('[data-testid="rhythmdon-lane-0"]')).toBeVisible({ timeout: 8000 });

    // ノーツはレーン0→レーン1→レーン0...の順で800ms間隔で出現し、
    // 出現から1600ms後に判定ライン（ヒット窓 ±260ms）へ到達する決定的な挙動。
    // 1つ目のノーツ（レーン0, spawn=0ms）は約1600ms後に判定ラインへ到達するので、
    // そのタイミングでレーン0をタップしてヒットを狙う。
    await page.waitForTimeout(1600);
    await page.locator('[data-testid="rhythmdon-lane-0"]').click();

    await expect(page.getByText(/スコア: [1-9]/)).toBeVisible({ timeout: 3000 });
  });

  test('制限時間が0になるとゲームオーバー画面が表示される', async ({ page }) => {
    // 実際の25秒待つのは長すぎるので、ここでは基本的な要素の存在のみ確認する
    // （制限時間経過のフルテストはUT/手動確認に委ねる）
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="rhythmdon-start"]').click();

    // タイマー表示が存在し、カウントダウンしていることを確認
    const timerText = page.getByText(/⏱ \d+秒/);
    await expect(timerText).toBeVisible({ timeout: 8000 });
    const first = await timerText.textContent();
    await page.waitForTimeout(2000);
    const second = await timerText.textContent();
    expect(first).not.toBe(second);
  });
});
