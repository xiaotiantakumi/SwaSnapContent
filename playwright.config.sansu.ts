import { defineConfig, devices } from '@playwright/test';

/**
 * sansu-100（100マス計算）用の E2E 設定。
 * ローカル SWA 環境（azurite + Azure Functions + Next.js）を ポート4280 で起動し、
 * 登録・アバター表示・ログインのフローを検証する。
 *
 * 実行: `npm run test:e2e:sansu`
 * （すでに `npm run sansu:dev` を起動済みなら、それを再利用する）
 */
export default defineConfig({
  testDir: './tests/sansu',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:4280',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
  ],
  /* ローカル SWA 環境を自動起動（起動済みなら再利用）。初回は azurite/func/next の
     ビルド・起動で時間がかかるためタイムアウトを長めにとる。 */
  webServer: {
    command: 'npm run sansu:dev',
    port: 4280,
    reuseExistingServer: true,
    timeout: 240000,
    stdout: 'ignore',
    stderr: 'ignore',
  },
  outputDir: 'test-results/sansu',
});
