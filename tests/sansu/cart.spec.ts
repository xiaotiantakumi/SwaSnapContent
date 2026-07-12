import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * PR3「カート状態＋UI」のE2E回帰テスト。
 *
 * - カゴへの投入/取消でバッジ枚数が正しく増減すること
 * - カート内合計金額が正しく計算されること
 * - コイン不足時は「ぜんぶかう」ボタンがdisabledになること
 *
 * コイン付与はローカル専用のデバッグAPI(/api/sansu/debug-grant)を使う（本番では403）。
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

async function registerAndGrantCoins(page: Page, amount: number): Promise<string> {
  const name = uniqueName();
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
  await enterPin(page, PIN, 'これでとうろく！');
  await page.waitForURL('**/sansu-100');

  const userId = await page.evaluate(() => {
    const raw = window.localStorage.getItem('sansu-100:current-user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as string;
    } catch {
      return null;
    }
  });
  expect(userId).toBeTruthy();

  const grantRes = await page.request.post('/api/sansu/debug-grant', {
    data: { userId, amount },
  });
  expect(grantRes.ok()).toBeTruthy();

  return name;
}

test.describe('sansu-100 カート機能（PR3）', () => {
  test('カゴに1個いれるとバッジが1になり、はずすと0に戻る', async ({ page }) => {
    await registerAndGrantCoins(page, 5000);

    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');

    const buyButton = page.getByTestId('buy-av_haircolor_f59797');
    await expect(buyButton).toBeVisible();
    await buyButton.click();

    await expect(page.getByTestId('cart-badge')).toHaveText('1');

    // カートパネルを開いて「はずす」で取り消す
    await page.getByRole('button', { name: 'カートをひらく' }).click();
    const panel = page.getByTestId('cart-panel');
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'はずす' }).click();

    await expect(page.getByTestId('cart-badge')).toHaveCount(0);
  });

  test('カゴに3個いれると合計金額が正しく表示される', async ({ page }) => {
    await registerAndGrantCoins(page, 5000);

    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');

    // 3つとも normal(🪙50)のアイテム → 合計150
    await page.getByTestId('buy-av_haircolor_f59797').click();
    await page.getByTestId('buy-av_haircolor_ecdcbf').click();
    await page.getByTestId('buy-av_haircolor_d6b370').click();

    await expect(page.getByTestId('cart-badge')).toHaveText('3');

    await page.getByRole('button', { name: 'カートをひらく' }).click();
    await expect(page.getByTestId('cart-total')).toHaveText('ぜんぶで 🪙150');
  });

  test('コインが たりないとき「ぜんぶかう」ボタンがdisabledになる', async ({ page }) => {
    // 合計150に満たない少額のコインだけ付与する
    await registerAndGrantCoins(page, 100);

    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('buy-av_haircolor_f59797').click();
    await page.getByTestId('buy-av_haircolor_ecdcbf').click();
    await page.getByTestId('buy-av_haircolor_d6b370').click();

    await page.getByRole('button', { name: 'カートをひらく' }).click();
    await expect(page.getByTestId('cart-total')).toHaveText('ぜんぶで 🪙150');
    await expect(page.getByTestId('cart-checkout')).toBeDisabled();
  });
});
