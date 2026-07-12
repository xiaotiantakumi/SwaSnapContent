import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * PR2「有料化検証」の回帰テスト。
 * - 無料値のみの avatarConfig が保存できること
 * - skinColor はショップに購入ボタンが無いこと（無料維持）
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `E2E${suffix}`;
}

async function enterPin(page: Page, pin: string, confirmLabel: string) {
  const pad = page.locator('[data-testid=pin-pad]');
  await pad.waitFor();
  for (const d of pin) {
    await pad.getByRole('button', { name: d, exact: true }).click();
  }
  await page.getByRole('button', { name: confirmLabel }).click();
}

async function expectBuiltAvatar(page: Page, name: string) {
  const avatar = page.locator(`[aria-label="${name}のアバター"]`).first();
  await expect(avatar).toBeVisible();
  await expect(avatar.locator('svg')).toBeVisible();
}

test.describe('sansu-100 アバター有料化（PR2）', () => {
  test('無料値のみのavatarConfigが保存できる', async ({ page }) => {
    const name = uniqueName();
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
    await page.waitForURL('**/sansu-100');
    await expectBuiltAvatar(page, name);

    // --- キャラづくりで無料値のみ選択して保存 ---
    await page.goto('/sansu-100/avatar');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-hairColor').click();
    await page.getByTestId('opt-hairColor-c93305').click();

    await page.getByTestId('tab-eyes').click();
    await page.getByTestId('opt-eyes-happy').click();

    await page.getByTestId('avatar-save').click();
    await expect(page.getByTestId('avatar-save')).toContainText('ほぞんしたよ');

    // --- ホームに戻り、保存済みの見た目がSVGとして描画されることを確認 ---
    await page.goto('/sansu-100');
    await page.waitForLoadState('networkidle');
    await expectBuiltAvatar(page, name);
  });

  test('skinColor購入ボタンがショップに存在しない', async ({ page }) => {
    const name = uniqueName();
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
    await page.waitForURL('**/sansu-100');

    // --- ショップに skinColor 系の購入ボタンが無いことを確認 ---
    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid^="buy-av_skin"]')).toHaveCount(0);
  });
});
