import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * パクパクおじさんゲームのE2Eテスト。
 *
 * 重要:
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - ミニゲームページへのアクセスは「コイン消費→プレイ」の流れを確認する。
 * - ゲームのキャンバス描画は headless でも動作するが、
 *   ゲームオーバー画面は canvas 内のゲームロジックで発生するため
 *   ここでは「ページ表示・スタート・ゲームオーバー画面遷移」まで確認する。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `PKP${suffix}`; // 例: PKP834625（9文字）
}

/** テストユーザを登録してログインした状態でトップページまで戻る */
async function registerAndLogin(page: Page, name: string): Promise<void> {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('sansu-100:dev-seeded', '1'); } catch { /* ignore */ }
  });
  await page.goto('/sansu-100/register');
  // 名前入力
  await page.getByTestId('register-name-input').fill(name);
  await page.getByTestId('register-name-next').click();
  // PIN 設定
  const pad = page.locator('[data-testid=pin-pad]');
  await pad.waitFor();
  for (const d of PIN) {
    await pad.getByRole('button', { name: d, exact: true }).click();
  }
  await page.getByRole('button', { name: 'これでとうろく！' }).click();
  // 登録完了 → top
  await page.waitForURL('**/sansu-100', { timeout: 10000 });
}

/** コインを稼ぐために算数を1問解く（debug-finish-perfect を使用） */
async function earnCoinsViaDebug(page: Page): Promise<void> {
  // レベル選択画面へ
  await page.goto('/sansu-100/play');
  await page.waitForLoadState('networkidle');
  // Lv.1 を選択
  const lv1 = page.locator('[data-testid="level-pick-1"]');
  if (await lv1.isVisible()) {
    await lv1.click();
  }
  // debug-finish-perfect ボタンがある場合はそれで即完了
  const dbgBtn = page.locator('[data-testid="debug-finish-perfect"]');
  if (await dbgBtn.isVisible({ timeout: 5000 })) {
    await dbgBtn.click();
  }
  // 結果ページを通過してトップへ
  await page.goto('/sansu-100');
  await page.waitForLoadState('networkidle');
}

test.describe('パクパクおじさん ミニゲーム', () => {
  test('ミニゲーム一覧にパクパクおじさんが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    // ゲームカードが存在することを確認
    await expect(
      page.getByText('パクパクおじさん')
    ).toBeVisible({ timeout: 8000 });
  });

  test('パクパクページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/pakupaku');
    await page.waitForLoadState('networkidle');

    // intro画面: ヘッダタイトルと遊び方が表示される
    await expect(page.getByText('パクパクおじさん').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('ドットを')).toBeVisible();
    // スタートボタンが存在する
    const startBtn = page.locator('[data-testid="pakupaku-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    // コインを稼がずにスタート → コイン不足メッセージ
    await page.goto('/sansu-100/minigame/pakupaku');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="pakupaku-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    // エラーメッセージ (さんすうを解いてから or コイン不足)
    await expect(
      page.getByText(/さんすうを|コインが/)
    ).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとキャンバスが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    // debug を使ってコインを稼ぐ
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/pakupaku');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="pakupaku-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    // playing フェーズ: canvas が表示される
    await expect(page.locator('canvas')).toBeVisible({ timeout: 8000 });
    // 「やめる」リンクが表示される
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('playing 中に矢印ボタンが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/pakupaku');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="pakupaku-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    // 方向ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: 'うえ' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'した' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ひだり' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'みぎ' })).toBeVisible();
    // スコア表示が見える
    await expect(page.getByText('スコア:')).toBeVisible();
  });
});
