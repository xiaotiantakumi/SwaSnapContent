import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * スワイプわけっこ（偶数/奇数 仕分けゲーム）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - スワイプ操作はheadlessでのpointer down/up再現が不安定になりやすいため、
 *   操作確認は画面下の「きすう」「ぐうすう」ボタン（swipesort-left/right）で行う。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `SWS${suffix}`;
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

test.describe('スワイプわけっこ ミニゲーム', () => {
  test('ミニゲーム一覧にスワイプわけっこが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('スワイプわけっこ')).toBeVisible({ timeout: 8000 });
  });

  test('スワイプわけっこページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/swipesort');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('スワイプわけっこ').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="swipesort-start"]');
    await expect(startBtn).toBeVisible();
  });

  test('コイン不足時にスタートするとエラーメッセージが出る', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await page.goto('/sansu-100/minigame/swipesort');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="swipesort-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(
      page.getByText(/さんすうを|コインが/)
    ).toBeVisible({ timeout: 6000 });
  });

  test('コイン取得後にスタートするとカードが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/swipesort');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="swipesort-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="swipesort-card"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="swipesort-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="swipesort-right"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('正しいボタンを押すと正解になりスコアが増える', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/swipesort');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="swipesort-start"]').click();

    const card = page.locator('[data-testid="swipesort-card"]');
    await expect(card).toBeVisible({ timeout: 8000 });

    // 正しい判定ボタンを押すと「せいかい！」が出て、スコアが加算される
    for (let i = 0; i < 5; i++) {
      const parity = await card.getAttribute('data-parity');
      const btn = page.locator(
        parity === 'even' ? '[data-testid="swipesort-right"]' : '[data-testid="swipesort-left"]'
      );
      await btn.click();
      await expect(page.getByTestId('swipesort-feedback')).toHaveText('◯ せいかい！', {
        timeout: 3000,
      });
      await page.waitForTimeout(350);
    }

    await expect(page.getByText(/スコア: 5/)).toBeVisible();
  });

  test('まちがえたボタンを3回押すとゲームオーバーになる', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/swipesort');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="swipesort-start"]').click();

    const card = page.locator('[data-testid="swipesort-card"]');
    await expect(card).toBeVisible({ timeout: 8000 });

    for (let i = 0; i < 3; i++) {
      const parity = await card.getAttribute('data-parity');
      // わざと逆のボタンを押して間違える
      const wrongBtn = page.locator(
        parity === 'even' ? '[data-testid="swipesort-left"]' : '[data-testid="swipesort-right"]'
      );
      await wrongBtn.click();
      await page.waitForTimeout(350);
    }

    await expect(page.getByTestId('swipesort-final-score')).toBeVisible({ timeout: 8000 });
  });
});
