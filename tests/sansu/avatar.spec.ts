import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * 登録 → 作成アバター(SVG)表示 → 選択ダイアログ → ログイン のE2E。
 *
 * 重要:
 * - 本番に実在するユーザ（例: たくみ）は触らない。毎回ユニークな名前のテストユーザを新規作成する。
 * - 「作成アバター」は DiceBearAvatar が <svg> を描画する。旧バグでは絵文字テキストのみで
 *   <svg> が無かった（ログイン画面・選択ダイアログ）。このテストは avatar 部分に <svg> が
 *   出ることを検証し、回帰を防ぐ。
 */

const PIN = '1234';

function uniqueName(): string {
  // 適当な（ただし衝突しない）テスト名。名前は12文字までなので短くする。
  // 本番ユーザ名（たくみ 等）と被らないよう接頭辞 E2E をつける。
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `E2E${suffix}`; // 例: E2E834625（9文字）
}

async function enterPin(page: Page, pin: string, confirmLabel: string) {
  const pad = page.locator('[data-testid=pin-pad]');
  await pad.waitFor();
  for (const d of pin) {
    await pad.getByRole('button', { name: d, exact: true }).click();
  }
  await page.getByRole('button', { name: confirmLabel }).click();
}

// AvatarDisplay 経由の「作成アバター」は <svg> を含む。emoji フォールバックは <span> のみ。
async function expectBuiltAvatar(page: Page, name: string) {
  const avatar = page.locator(`[aria-label="${name}のアバター"]`).first();
  await expect(avatar).toBeVisible();
  await expect(avatar.locator('svg')).toBeVisible();
}

test.describe('sansu-100 登録・アバター・ログイン', () => {
  test('登録すると作成アバター(SVG)で表示され、選択ダイアログ・ログインでも同じアバターが出る', async ({
    page,
  }) => {
    const name = uniqueName();
    // Playwright は各テストで隔離コンテキスト（localStorage 空）なので明示クリアは不要。
    // ただしローカルの dev-seed が「たろう」を作って自動ログインしてしまうため、
    // seed のガード(sessionStorage)を先に立てて無効化する（テスト専用・アプリ非変更）。
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('sansu-100:dev-seeded', '1');
      } catch {
        /* ignore */
      }
    });

    // --- 登録 ---
    await page.goto('/sansu-100/register');
    await page.getByTestId('register-name-input').fill(name);
    await page.getByTestId('register-name-next').click();
    await enterPin(page, PIN, 'これでとうろく！');

    // ホームへ遷移。あいさつのアバターが作成アバター(SVG)であること。
    await page.waitForURL('**/sansu-100');
    await expectBuiltAvatar(page, name);

    // --- 選択（ログイン）ダイアログ: ログアウト状態で recentUsers から選ぶ ---
    await page.evaluate(() => localStorage.removeItem('sansu-100:current-user'));
    await page.goto('/sansu-100');
    await page.waitForLoadState('networkidle');
    const tile = page.locator('[data-testid^="user-tile-"]').first();
    await expect(tile).toBeVisible();
    await expect(tile.locator('svg')).toBeVisible(); // タイルも作成アバター
    // ハイドレーション/再レンダの落ち着きを待ってからクリック（要素のdetach回避）
    await page.waitForTimeout(600);
    await tile.click();
    await expect(page.locator('[data-testid=pin-pad]')).toBeVisible();
    await expectBuiltAvatar(page, name); // ← 旧バグ(絵文字のみ)では失敗する箇所

    // あいことばを入れてログイン
    await enterPin(page, PIN, 'これでOK！');
    await page.waitForURL('**/sansu-100');
    await expectBuiltAvatar(page, name);

    // --- 名前さがしのログイン画面でも作成アバターが出る ---
    await page.evaluate(() => localStorage.removeItem('sansu-100:current-user'));
    await page.goto('/sansu-100/login');
    await page.getByRole('textbox').first().fill(name);
    await page.getByRole('button', { name: 'さがす' }).click();
    await expect(page.locator('[data-testid=pin-pad]')).toBeVisible();
    await expectBuiltAvatar(page, name); // ← 旧バグ(絵文字のみ)では失敗する箇所

    await enterPin(page, PIN, 'これでOK！');
    await page.waitForURL('**/sansu-100');
  });
});
