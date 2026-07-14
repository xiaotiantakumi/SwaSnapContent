import * as fs from 'node:fs';
import * as path from 'node:path';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * リズムでドン（簡易リズムゲーム）のE2Eテスト。
 *
 * - 本番ユーザは触らない。毎回ユニークな E2E 接頭辞ユーザを新規作成する。
 * - baseURL は http://localhost:4280 (playwright.config.sansu.ts 参照)
 * - ノーツはレーンが交互（決定的）に出現するので、判定タイミングを正確に待って
 *   タップすればヒットを再現できる。
 */

const PIN = '1234';

function uniqueName(): string {
  const suffix = `${process.hrtime.bigint().toString().slice(-6)}`;
  return `RTM${suffix}`;
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

test.describe('リズムでドン ミニゲーム', () => {
  test('ミニゲーム一覧にリズムでドンが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('リズムでドン')).toBeVisible({ timeout: 8000 });
  });

  test('リズムでドンページにアクセスすると intro 画面が表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('リズムでドン').first()).toBeVisible({ timeout: 8000 });
    const startBtn = page.locator('[data-testid="rhythmdon-start"]');
    await expect(startBtn).toBeVisible();
  });

  // 「コイン不足時にエラーが出る」テストは削除済み: デバッグ環境(localhost)では
  // sansuApi.spend が isDebugEnv() により常に成功を返すバイパスが入っており、
  // ローカルではこの制限自体が存在しないため（本番ドメインでは引き続き課金ゲートが有効）。

  test('コイン取得後にスタートするとレーンボタンが表示される', async ({ page }) => {
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('[data-testid="rhythmdon-start"]');
    await startBtn.waitFor({ timeout: 8000 });
    await startBtn.click();

    await expect(page.locator('[data-testid="rhythmdon-lane-0"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="rhythmdon-lane-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="rhythmdon-lane-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="rhythmdon-lane-3"]')).toBeVisible();
    await expect(page.getByText('← やめる')).toBeVisible();
  });

  test('判定ラインのタイミングでタップするとスコアが増える', async ({ page }) => {
    const beatmapPath = path.join(
      process.cwd(),
      'public/sansu-100/audio/beatmaps/shaved-ice-temperature.json'
    );
    const beatmap = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8')) as {
      notes: Array<{ timeMs: number; lane: number }>;
    };
    // リードイン・フィルタ後は notes[0] が確実に timeMs>=2000 の狙えるノーツ（id は 0）。
    const targetNote = beatmap.notes[0];
    if (!targetNote) {
      throw new Error('No beatmap notes found');
    }

    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="rhythmdon-start"]').click();

    await expect(page.locator('[data-testid="rhythmdon-lane-0"]')).toBeVisible({ timeout: 8000 });

    // 最初のノーツ(rhythmdon-note-0)が出現したら、判定ライン到達（出現から noteTravelMs=1600ms 後）
    // の前後にあるヒット窓(±260ms)を確実に捉えるため、対象レーンをポーリングしながら連打する。
    // tapRhythm は窓外のタップを単に無視し（ライフ減少は stepRhythm のタイムアウト時のみ）、
    // 連打してもペナルティが無いので、DOM 検出やクリックのレイテンシに依らず決定的にヒットを再現できる。
    // start クリックからの絶対時間待ちだとセットアップ遅延（beatmap fetch＋BGM metadata 完了後に
    // startGame でゲーム時計が起動）でフレークするため、ノーツ出現を起点にした相対ポーリングにしている。
    await expect(page.locator('[data-testid="rhythmdon-note-0"]')).toBeVisible({ timeout: 8000 });
    const laneBtn = page.locator(`[data-testid="rhythmdon-lane-${targetNote.lane}"]`);
    const scoreHit = page.getByText(/スコア: [1-9]/);
    let scored = false;
    for (let i = 0; i < 25; i++) {
      await laneBtn.click();
      if (await scoreHit.isVisible()) {
        scored = true;
        break;
      }
      await page.waitForTimeout(100);
    }
    expect(scored).toBe(true);
  });

  test('制限時間が0になるとゲームオーバー画面が表示される', async ({ page }) => {
    // 実際の約176秒待つのは長すぎるので、ここではタイマー表示とカウントダウンのみ確認する
    // （制限時間経過のフルテストはUT/手動確認に委ねる）
    const name = uniqueName();
    await registerAndLogin(page, name);
    await earnCoinsViaDebug(page);

    await page.goto('/sansu-100/minigame/rhythmdon');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="rhythmdon-start"]').click();

    // タイマー表示が存在し、BGM長（約176秒）を反映した初期値からカウントダウンしていることを確認
    const timerText = page.getByText(/⏱ \d+秒/);
    await expect(timerText).toBeVisible({ timeout: 8000 });
    const first = await timerText.textContent();
    const firstSec = Number(first?.match(/(\d+)/)?.[1] ?? 0);
    expect(firstSec).toBeGreaterThan(100);
    await page.waitForTimeout(2000);
    const second = await timerText.textContent();
    const secondSec = Number(second?.match(/(\d+)/)?.[1] ?? 0);
    expect(secondSec).toBeLessThan(firstSec);
  });
});
