import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for tests excluding authentication tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* 認証エミュレーターテストを除外 */
  testIgnore: '**/auth-emulator.spec.ts',
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
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure - オブジェクト形式で設定 */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Wait for actionability */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stderr: 'ignore',
      stdout: 'ignore',
    },
    // API server for integration tests
    ...(process.env.WITH_API ? [{
      command: 'cd api && npm run build && npx func start --port 7072 --cors true',
      url: 'http://localhost:7072',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // Increased timeout for Azure Functions startup
      stderr: 'ignore' as const,
      stdout: 'ignore' as const,
    }] : []),
  ],

  /* Test output directory */
  outputDir: 'test-results/no-auth',
});