import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * PR4「バッチ購入API（all-or-nothing）」のE2E回帰テスト。
 *
 * - カートから複数アイテムを一括購入できること
 * - 残高不足時はサーバー側で1件も購入されないこと（all-or-nothing）
 * - 既所持アイテムがカートに混在しても二重課金されないこと
 *
 * コイン付与はローカル専用のデバッグAPI(/api/sansu/debug-grant)を使う（本番では403）。
 */

const PIN = '1234';

const ITEM_A = 'av_haircolor_f59797';
const ITEM_B = 'av_haircolor_ecdcbf';
const ITEM_C = 'av_haircolor_d6b370';
const ITEM_PRICE = 50;

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

async function registerUser(page: Page): Promise<string> {
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
  return userId as string;
}

async function registerAndGrantCoins(page: Page, amount: number): Promise<string> {
  const userId = await registerUser(page);
  const grantRes = await page.request.post('/api/sansu/debug-grant', {
    data: { userId, amount },
  });
  expect(grantRes.ok()).toBeTruthy();
  return userId;
}

async function fetchUser(
  page: Page,
  userId: string
): Promise<{ coins: number; ownedItems: string[] }> {
  const res = await page.request.get(
    `/api/sansu/users?userId=${encodeURIComponent(userId)}`
  );
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { coins?: number; ownedItems?: string[] };
  return {
    coins: body.coins ?? 0,
    ownedItems: body.ownedItems ?? [],
  };
}

function coinBalanceLocator(page: Page) {
  return page.getByLabel(/コイン \d+まい/);
}

test.describe('sansu-100 バッチ購入（PR4）', () => {
  test('カートから複数アイテムを一括購入できる', async ({ page }) => {
    await registerAndGrantCoins(page, 5000);

    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');

    await expect(coinBalanceLocator(page)).toContainText('5000');

    await page.getByTestId(`buy-${ITEM_A}`).click();
    await page.getByTestId(`buy-${ITEM_B}`).click();
    await page.getByTestId(`buy-${ITEM_C}`).click();
    await expect(page.getByTestId('cart-badge')).toHaveText('3');

    await page.getByRole('button', { name: 'カートをひらく' }).click();
    await expect(page.getByTestId('cart-total')).toHaveText('ぜんぶで 🪙150');
    await page.getByTestId('cart-checkout').click();

    await expect(page.getByText('カートの アイテムを ぜんぶ かったよ')).toBeVisible();
    await expect(page.getByTestId('cart-badge')).toHaveCount(0);

    await expect(coinBalanceLocator(page)).toContainText('4850');

    for (const name of ['さくらピンク', 'ミルクベージュ', 'はちみつ']) {
      const card = page
        .getByText(name, { exact: true })
        .locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
      await expect(card.getByText('もってる✓')).toBeVisible();
    }
  });

  test('残高不足のときバッチ購入APIは1件も購入しない（all-or-nothing）', async ({
    page,
  }) => {
    const userId = await registerAndGrantCoins(page, 100);

    const before = await fetchUser(page, userId);
    expect(before.coins).toBe(100);
    expect(before.ownedItems).toEqual([]);

    const batchRes = await page.request.post('/api/sansu/purchase/batch', {
      data: { userId, itemIds: [ITEM_A, ITEM_B, ITEM_C] },
    });
    expect(batchRes.status()).toBe(409);
    const batchBody = (await batchRes.json()) as {
      error?: string;
      shortfall?: number;
      total?: number;
    };
    expect(batchBody.error).toBe('insufficient');
    expect(batchBody.total).toBe(150);
    expect(batchBody.shortfall).toBe(50);

    const after = await fetchUser(page, userId);
    expect(after.coins).toBe(100);
    expect(after.ownedItems).toEqual([]);
  });

  test('既所持アイテムがitemIdsに混在しても二重課金されない', async ({ page }) => {
    // 既所持アイテムはショップUI上「もってる✓」となりカートに入れられないため、
    // 「クライアントの状態が古い等でitemIdsに既所持分が混ざって送られてくる」
    // ケースをAPIレベルで直接検証する（サーバー側dedupの確認）。
    const userId = await registerAndGrantCoins(page, 5000);

    const buyOne = await page.request.post('/api/sansu/purchase', {
      data: { userId, action: 'buy', itemId: ITEM_A },
    });
    expect(buyOne.ok()).toBeTruthy();

    const afterSingle = await fetchUser(page, userId);
    expect(afterSingle.coins).toBe(5000 - ITEM_PRICE);
    expect(afterSingle.ownedItems).toContain(ITEM_A);

    const batchRes = await page.request.post('/api/sansu/purchase/batch', {
      data: { userId, itemIds: [ITEM_A, ITEM_B, ITEM_C] },
    });
    expect(batchRes.ok()).toBeTruthy();
    const batchBody = (await batchRes.json()) as { total?: number };
    // ITEM_Aは既所持なので合計に含まれない（未所持2件分のみ）
    expect(batchBody.total).toBe(ITEM_PRICE * 2);

    const afterBatch = await fetchUser(page, userId);
    expect(afterBatch.ownedItems).toEqual(
      expect.arrayContaining([ITEM_A, ITEM_B, ITEM_C])
    );
    // 単品購入50 + 未所持2件分100 = 合計150の減少（ITEM_Aへの二重課金なし）
    expect(afterBatch.coins).toBe(5000 - ITEM_PRICE - ITEM_PRICE * 2);
  });

  test('カートUI上では既所持アイテムに「もってる✓」が表示されカゴにいれられない', async ({
    page,
  }) => {
    const userId = await registerAndGrantCoins(page, 5000);
    const buyOne = await page.request.post('/api/sansu/purchase', {
      data: { userId, action: 'buy', itemId: ITEM_A },
    });
    expect(buyOne.ok()).toBeTruthy();

    await page.goto('/sansu-100/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId(`buy-${ITEM_A}`)).toHaveCount(0);
    const card = page
      .getByText('さくらピンク', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    await expect(card.getByText('もってる✓')).toBeVisible();
  });
});
