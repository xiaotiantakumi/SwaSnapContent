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
  // useSansuUser のマウント時サーバー同期(reconcileWithServer)が後でローカルに
  // 注入するテスト用データを上書きしてしまうため、/api/sansu/users への応答を
  // 常にローカルstorageの内容で返すようモックする(本番ではサーバー側が正として
  // 動く設計だが、E2Eではローカル注入データを権威データとして扱わせたい)。
  // 登録前から張っておかないと、登録直後の最初の同期がすり抜けて未モックの
  // 実サーバー応答で上書きされてしまうため、必ず最初に設定する。
  await page.route('**/api/sansu/users*', async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') return route.continue();
    const usersRaw = await page.evaluate(() => localStorage.getItem('sansu-100:users'));
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    const url = new URL(request.url());
    const userId = url.searchParams.get('userId');
    const user = users.find((u: { id: string }) => u.id === userId);
    if (!user) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
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
  const bestTimesByLevel = {
    'lv1:add': 45000,
    'lv3:sub': 72000,
    'lv5:mul': 95000,
  };
  await page.evaluate((bestTimesByLevel) => {
    const userId = localStorage.getItem('sansu-100:current-user');
    if (!userId) return;
    const id = JSON.parse(userId) as string;
    const usersRaw = localStorage.getItem('sansu-100:users');
    if (!usersRaw) return;
    const users = JSON.parse(usersRaw);
    const user = users.find((u: { id: string }) => u.id === id);
    if (!user) return;
    user.bestTimesByLevel = bestTimesByLevel;
    localStorage.setItem('sansu-100:users', JSON.stringify(users));
    const sessKey = `sansu-100:sessions:${id}`;
    const existing = localStorage.getItem(sessKey);
    if (!existing) localStorage.setItem(sessKey, JSON.stringify([]));
  }, bestTimesByLevel);

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

  // bestTimesByLevel を空にしておく(新規登録直後は既に空だが明示的に確認)
  await page.evaluate(() => {
    const userId = localStorage.getItem('sansu-100:current-user');
    if (!userId) return;
    const id = JSON.parse(userId) as string;
    const usersRaw = localStorage.getItem('sansu-100:users');
    if (!usersRaw) return;
    const users = JSON.parse(usersRaw);
    const user = users.find((u: { id: string }) => u.id === id);
    if (!user) return;
    user.bestTimesByLevel = {};
    localStorage.setItem('sansu-100:users', JSON.stringify(users));
  });

  await page.goto('/sansu-100/history');

  // セクションは表示されないはず
  await expect(page.getByTestId('best-times-section')).not.toBeVisible();
});
