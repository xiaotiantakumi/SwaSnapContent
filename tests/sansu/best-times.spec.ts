import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Issue #129: きろく画面にレベル別ベストタイム表が表示されることを検証するE2E。
 *
 * - localStorage の bestTimesByLevel にダミーデータを注入して
 *   /sansu-100/history を開き、best-times-section と各行が表示されるか確認する。
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

test('きろく画面にベストタイム一覧が表示される', async ({ page }) => {
  const name = uniqueName();
  await registerUser(page, name);

  // bestTimesByLevel にダミーデータを注入する
  await page.evaluate((userName) => {
    const raw = localStorage.getItem('sansu_current_user');
    if (!raw) return;
    const user = JSON.parse(raw);
    user.bestTimesByLevel = {
      'lv1:add': 45000,
      'lv3:sub': 72000,
      'lv5:mul': 95000,
    };
    localStorage.setItem('sansu_current_user', JSON.stringify(user));
    const sessKey = `sansu_sessions_${user.id}`;
    const existing = localStorage.getItem(sessKey);
    if (!existing) localStorage.setItem(sessKey, JSON.stringify([]));
  }, name);

  await page.goto('/sansu-100/history');

  const section = page.getByTestId('best-times-section');
  await expect(section).toBeVisible();

  await expect(page.getByTestId('best-row-lv1-add')).toBeVisible();
  await expect(page.getByTestId('best-row-lv3-sub')).toBeVisible();
  await expect(page.getByTestId('best-row-lv5-mul')).toBeVisible();

  // タイムが表示されていることを確認
  await expect(page.getByTestId('best-row-lv1-add')).toContainText('0:45');
});

test('ベストタイムが未登録の場合はセクションが表示されない', async ({ page }) => {
  const name = uniqueName();
  await registerUser(page, name);

  // bestTimesByLevel を空にしておく
  await page.evaluate(() => {
    const raw = localStorage.getItem('sansu_current_user');
    if (!raw) return;
    const user = JSON.parse(raw);
    user.bestTimesByLevel = {};
    localStorage.setItem('sansu_current_user', JSON.stringify(user));
  });

  await page.goto('/sansu-100/history');

  // セクションは表示されないはず
  await expect(page.getByTestId('best-times-section')).not.toBeVisible();
});
