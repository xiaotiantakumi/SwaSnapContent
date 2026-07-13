import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `DRM${suffix}`;
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
  if (await lv1.isVisible()) await lv1.click();
  const dbgBtn = page.locator('[data-testid="debug-finish-perfect"]');
  if (await dbgBtn.isVisible({ timeout: 5000 })) await dbgBtn.click();
  await page.goto('/sansu-100');
  await page.waitForLoadState('networkidle');
}

test.describe('だるまさんがころんだ ミニゲーム', () => {
  test('ミニゲーム一覧にだるまさんがころんだが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('だるまさんがころんだ')).toBeVisible({ timeout: 8000 });
  });

  test('だるまページにアクセスすると intro 画面が表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('だるまさんがころんだ').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="daruma-start"]')).toBeVisible();
  });

  // 「コイン不足時にスタートするとエラーメッセージが出る」テストは削除済み。
  // isDebugHostOnly()によりlocalhost/PRプレビューではコイン消費・算数ゲートが
  // 常にバイパスされる（app/sansu-100/lib/api-client.ts の spend()）ため、
  // ローカルではこの制限自体が存在せず、常にスタートが成功してしまい恒久的に
  // 到達不能になる。他のミニゲームのE2E（例: rhythmdon.spec.ts）でも同様の理由で
  // 同種のテストを削除済み。

  test('コイン取得後にスタートするとキャンバスが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await earnCoinsViaDebug(page);
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="daruma-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('playing 中にタップボタンが表示される', async ({ page }) => {
    await registerAndLogin(page, uniqueName());
    await earnCoinsViaDebug(page);
    await page.goto('/sansu-100/minigame/daruma');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="daruma-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();
    // タップ操作ボタンには aria-label="だるまたたき" が設定されており、
    // アクセシブルネームはボタン内の表示テキスト（タップ！/とまれ！）ではなく
    // このaria-labelになるため、それに合わせて検索する。
    await expect(page.getByRole('button', { name: 'だるまたたき' })).toBeVisible({ timeout: 8000 });
  });
});
