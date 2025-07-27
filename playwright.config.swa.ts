import { defineConfig, devices } from '@playwright/test';

/**
 * SWA CLI (Azure Static Web Apps CLI) 用の Playwright 設定
 * ポート 4280 で動作する SWA 認証エミュレーターをテスト
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* 認証テストのみ実行 */
  testMatch: '**/auth-emulator.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4280',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Wait for actionability */
    actionTimeout: 10000,
    
    /* Navigation timeout - 認証処理に時間がかかる場合があるため長めに設定 */
    navigationTimeout: 30000,
    
    /* ページの読み込み待機時間 */
    waitForTimeout: 5000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false, // 認証エミュレーターを確認するため表示モード
      },
    },
  ],

  /* SWA CLI を自動起動 */
  webServer: {
    command: 'npm run swa:all',
    port: 4280,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2分のタイムアウト
  },

  /* Test output directory */
  outputDir: 'test-results',
});