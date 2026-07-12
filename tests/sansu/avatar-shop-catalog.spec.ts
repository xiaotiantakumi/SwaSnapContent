import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * PR1「カタログ拡充」の回帰テスト。
 * 新カテゴリ(hairstyle/haircolor/eyebrow/mouthstyle/clothescolor)のアイテムを
 * ショップで購入 → キャラづくりで選択 → 保存後もAvatarDisplayに<svg>が描画される、
 * という一連のE2Eを検証する。
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

async function expectBuiltAvatar(page: Page, name: string) {
  const avatar = page.locator(`[aria-label="${name}のアバター"]`).first();
  await expect(avatar).toBeVisible();
  await expect(avatar.locator('svg')).toBeVisible();
}

test.describe('sansu-100 拡充アバターカタログ（PR1）', () => {
  test('新カテゴリのアイテムを購入してキャラづくりで選択すると、保存後もSVGが描画される', async ({
    page,
  }) => {
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

    // --- テスト用にコインを付与（ローカル限定のデバッグAPI） ---
    // storage.setCurrentUserId は id を JSON.stringify しただけの文字列を保存する。
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
      data: { userId, amount: 5000 },
    });
    expect(grantRes.ok()).toBeTruthy();

    // --- ショップで新カテゴリ（かみのいろ・まゆげ）のアイテムをカゴにいれて、まとめて購入 ---
    // PR3でアバターアイテムは即時購入からカート方式に変わったため、カゴにいれて
    // カートの「ぜんぶかう」から購入する。
    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');

    const haircolorBuy = page.getByTestId('buy-av_haircolor_c7a2ff');
    await expect(haircolorBuy).toBeVisible();
    await haircolorBuy.click();

    const eyebrowBuy = page.getByTestId('buy-av_eyebrow_unibrowNatural');
    await expect(eyebrowBuy).toBeVisible();
    await eyebrowBuy.click();

    await expect(page.getByTestId('cart-badge')).toHaveText('2');
    await page.getByRole('button', { name: 'カートをひらく' }).click();
    await page.getByTestId('cart-checkout').click();
    await expect(page.getByText('を ぜんぶ かったよ！')).toBeVisible();

    // --- キャラづくりで購入した値を選択して保存 ---
    await page.goto('/sansu-100/avatar');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-hairColor').click();
    await page.getByTestId('opt-hairColor-c7a2ff').click();

    await page.getByTestId('tab-eyebrows').click();
    await page.getByTestId('opt-eyebrows-unibrowNatural').click();

    await page.getByTestId('avatar-save').click();
    await expect(page.getByTestId('avatar-save')).toContainText('ほぞんしたよ');

    // --- ホームに戻り、保存済みの見た目がSVGとして描画されることを確認 ---
    await page.goto('/sansu-100');
    await page.waitForLoadState('networkidle');
    await expectBuiltAvatar(page, name);
  });
});
