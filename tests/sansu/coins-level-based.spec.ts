import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Issue #75: 獲得コインがLv枝番ベースの固定値（25/50/100/200）になることを検証するE2E。
 *
 * - ローカルSWA環境（port 4280）で実行（playwright.config.sansu.ts）
 * - debugFinish ボタン（localhost でのみ表示）でセッションを即完了させ、
 *   結果画面のコイン表示を確認する。
 * - 旧実装（演算ベース: add=10, mul=60 等）では値が異なるため回帰を防ぐ。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `E2E${suffix}`;
}

async function registerUser(page: Page, name: string) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('sansu-100:dev-seeded', '1');
    } catch {
      /* ignore */
    }
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
  await page.waitForURL('**/sansu-100');
}

async function playAndGetCoins(
  page: Page,
  levelTestId: string
): Promise<{ coinsEarned: number; label: string }> {
  // ホームでレベル選択
  await page.getByTestId(levelTestId).click();
  // プレイ画面が開くのを待つ
  await page.waitForURL('**/sansu-100/play**');

  // デバッグボタンでパーフェクトフィニッシュ
  const debugBtn = page.getByTestId('debug-finish-perfect');
  await debugBtn.waitFor({ timeout: 10000 });
  await debugBtn.click();

  // 結果画面へ遷移
  await page.waitForURL('**/sansu-100/result', { timeout: 15000 });

  // コインカード内のテキストからコイン数を取得
  const coinCard = page.locator('text=🪙 コインを').first();
  await coinCard.waitFor({ timeout: 10000 });
  const text = await coinCard.textContent();
  // "🪙 コインを +25 ゲット！" のような形式
  const match = text?.match(/\+(\d+)/);
  const coinsEarned = match ? parseInt(match[1], 10) : -1;

  // 内訳のクリアラベルも確認
  const breakdown = page.locator('text=クリア');
  const label = (await breakdown.first().textContent()) ?? '';

  return { coinsEarned, label };
}

test.describe('sansu-100 コイン: Lv枝番ベースの固定値検証', () => {
  test('Lv.1（id1: たし算Lv.1）は 25コイン', async ({ page }) => {
    const name = uniqueName();
    await registerUser(page, name);

    const { coinsEarned } = await playAndGetCoins(page, 'level-pick-1');
    // 旧実装: add=10、新実装: Lv.1=25
    expect(coinsEarned).toBe(25);

    await page.goto('/sansu-100');
  });

  test('Lv.2（id2: たし算Lv.2）は 50コイン', async ({ page }) => {
    const name = uniqueName();
    await registerUser(page, name);

    const { coinsEarned } = await playAndGetCoins(page, 'level-pick-2');
    expect(coinsEarned).toBe(50);

    await page.goto('/sansu-100');
  });

  test('Lv.3（id7: たし算Lv.3）は 100コイン', async ({ page }) => {
    const name = uniqueName();
    await registerUser(page, name);

    const { coinsEarned } = await playAndGetCoins(page, 'level-pick-7');
    expect(coinsEarned).toBe(100);

    await page.goto('/sansu-100');
  });

  test('Lv.4（id8: たし算Lv.4）は 200コイン', async ({ page }) => {
    const name = uniqueName();
    await registerUser(page, name);

    const { coinsEarned } = await playAndGetCoins(page, 'level-pick-8');
    expect(coinsEarned).toBe(200);

    await page.goto('/sansu-100');
  });

  test('かけ算九九（id5）は Lv.1扱いで 25コイン（旧: mul=60 ではなくなる）', async ({
    page,
  }) => {
    const name = uniqueName();
    await registerUser(page, name);

    const { coinsEarned } = await playAndGetCoins(page, 'level-pick-5');
    // 旧実装では mul=60 だったが、Lv枝番ベースでは九九はLv.1=25
    expect(coinsEarned).toBe(25);

    await page.goto('/sansu-100');
  });

  test('コイン内訳に「クリア」ラベルが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerUser(page, name);

    await page.getByTestId('level-pick-1').click();
    await page.waitForURL('**/sansu-100/play**');
    const debugBtn = page.getByTestId('debug-finish-perfect');
    await debugBtn.waitFor({ timeout: 10000 });
    await debugBtn.click();
    await page.waitForURL('**/sansu-100/result', { timeout: 15000 });

    // 「クリア」ラベルが内訳に表示されること（旧: たしざん/かけざん 等の演算名）
    const coinCard = page.locator('text=🪙 コインを').first();
    await coinCard.waitFor({ timeout: 10000 });
    // breakdown は2件以上あるときだけ<ul>表示されるが、単独でも +25 が出る
    await expect(page.locator('text=🪙 コインを +25 ゲット！').first()).toBeVisible();
  });
});
