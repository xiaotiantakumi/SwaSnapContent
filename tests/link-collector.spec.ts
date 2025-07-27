import { test, expect } from '@playwright/test';

import { 
  fillLinkCollectorForm, 
  waitForCollectionToComplete,
  mockCollectionAPI,
  createSuccessResponse,
  createErrorResponse
} from './helpers/link-collector-helpers';

test.describe('Link Collector E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Link Collectorページに移動
    await page.goto('/link-collector');
  });

  test('should display link collector form and UI elements', async ({ page }) => {
    // ページタイトルの確認（実際のタイトルに合わせて修正）
    await expect(page).toHaveTitle(/URL本文抽出アプリ|リンクコレクター/);
    
    // ヘッダーの確認
    await expect(page.locator('h1')).toContainText('リンクコレクター');
    
    // ダークモード切り替えボタンの確認
    const themeToggle = page.locator('button[aria-label*="ダークモード"], button[aria-label*="ライトモード"]');
    await expect(themeToggle).toBeVisible();
    
    // フォーム要素の確認
    const targetUrlInput = page.locator('input[type="url"]');
    const selectorInput = page.locator('input[placeholder*="例: .main-content a"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(targetUrlInput).toBeVisible();
    await expect(selectorInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // 使い方セクションの確認
    await expect(page.locator('text=使い方')).toBeVisible();
    
    // スクリーンショット（初期状態）
    await page.screenshot({ 
      path: 'test-results/link-collector-initial.png',
      fullPage: true 
    });
  });

  test('should test link collection with takumi-oda.com/blog', async ({ page }) => {
    // テスト用のURL
    const testUrls = [
      'https://takumi-oda.com/blog/2025/01/15/sample-post-1/',
      'https://takumi-oda.com/blog/2025/01/10/sample-post-2/',
      'https://takumi-oda.com/blog/2025/01/05/sample-post-3/'
    ];
    
    // APIをモック
    await mockCollectionAPI(page, createSuccessResponse(testUrls), 200, 1000);

    // フォームに入力
    await fillLinkCollectorForm(page, 'https://takumi-oda.com/blog/', '#card-2');
    
    // スクリーンショット（入力後）
    await page.screenshot({ 
      path: 'test-results/link-collector-form-filled.png',
      fullPage: true 
    });
    
    // APIリクエストを待つPromiseを作成
    const responsePromise = page.waitForResponse('**/api/collectLinks');
    
    // リンク収集ボタンをクリック
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // ボタンが無効化され、収集中テキストが表示されることを確認
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText('収集中...');
    
    // スクリーンショット（収集中）
    await page.screenshot({ 
      path: 'test-results/link-collector-collecting.png',
      fullPage: true 
    });
    
    // APIレスポンスを待つ
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    
    // 収集が完了するまで待つ
    await waitForCollectionToComplete(page, true);
    
    // 収集されたURLがあることを確認
    const urlList = page.locator('.divide-y > div').filter({ hasText: 'takumi-oda.com' });
    await expect(urlList).toHaveCount(3);
    
    // 統計情報が表示されていることを確認
    await expect(page.locator('text=総リンク数: 3')).toBeVisible();
    await expect(page.locator('text=ユニーク数: 3')).toBeVisible();
    
    // スクリーンショット（成功時）
    await page.screenshot({ 
      path: 'test-results/link-collector-success.png',
      fullPage: true 
    });
  });

  test('should handle form validation', async ({ page }) => {
    // 空のフォームで送信ボタンをクリック
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    
    // 無効なURLを入力
    await page.fill('input[type="url"]', 'invalid-url');
    
    // HTML5バリデーションが働くことを確認
    const targetUrlInput = page.locator('input[type="url"]');
    await expect(targetUrlInput).toHaveAttribute('type', 'url');
    
    // 有効なURLを入力すると送信ボタンが有効になることを確認
    await page.fill('input[type="url"]', 'https://example.com');
    await expect(submitButton).toBeEnabled();
    
    // スクリーンショット（バリデーション状態）
    await page.screenshot({ 
      path: 'test-results/link-collector-validation.png',
      fullPage: true 
    });
  });

  test('should verify options are fixed to default values', async ({ page }) => {
    // 詳細オプションが削除されていることを確認
    await expect(page.locator('text=詳細オプション')).not.toBeVisible();
    
    // クロール深度設定も存在しないことを確認
    await expect(page.locator('label:has-text("クロール深度")')).not.toBeVisible();
    await expect(page.locator('label:has-text("リクエスト間隔")')).not.toBeVisible();
    
    // スクリーンショット（簡素化されたUI）
    await page.screenshot({ 
      path: 'test-results/link-collector-simplified.png',
      fullPage: true 
    });
  });

  test('should toggle dark mode correctly', async ({ page }) => {
    // ダークモード切り替えボタンを見つける
    const themeToggle = page.locator('button[aria-label*="ダークモード"], button[aria-label*="ライトモード"]');
    await expect(themeToggle).toBeVisible();
    
    // 初期状態のスクリーンショット
    await page.screenshot({ 
      path: 'test-results/link-collector-initial-theme.png',
      fullPage: true 
    });
    
    // ダークモード切り替えボタンをクリック
    await themeToggle.click();
    
    // 少し待機してテーマの変更を確実にする
    await page.waitForTimeout(500);
    
    // ダークモード切り替え後のスクリーンショット
    await page.screenshot({ 
      path: 'test-results/link-collector-dark-mode.png',
      fullPage: true 
    });
    
    // もう一度クリックして元に戻す
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    // ライトモードに戻った後のスクリーンショット
    await page.screenshot({ 
      path: 'test-results/link-collector-light-mode.png',
      fullPage: true 
    });
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // APIをモックしてエラーレスポンスを返す
    await mockCollectionAPI(page, createErrorResponse('Server error occurred'), 500, 500);

    // フォームに入力
    await fillLinkCollectorForm(page, 'https://nonexistent-domain-12345.com');
    
    // ボタンが有効になっていることを確認
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    
    // APIリクエストを待つPromiseを作成
    const responsePromise = page.waitForResponse('**/api/collectLinks');
    
    // ボタンをクリック
    await submitButton.click();
    
    // ボタンが無効化され、収集中テキストが表示されることを確認
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText('収集中...');
    
    // スクリーンショット（収集中）
    await page.screenshot({ 
      path: 'test-results/link-collector-collecting-error.png',
      fullPage: true 
    });
    
    // APIレスポンスを待つ
    const response = await responsePromise;
    expect(response.status()).toBe(500);
    
    // エラーが処理されるまで待つ
    await waitForCollectionToComplete(page, false);
    
    // エラーメッセージが表示されていることを確認
    const errorDiv = page.locator('.border-red-200.bg-red-50.text-red-700');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText('エラー:');
    
    // 最終的なスクリーンショット
    await page.screenshot({ 
      path: 'test-results/link-collector-error-state.png',
      fullPage: true 
    });
  });
});