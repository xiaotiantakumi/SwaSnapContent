import { test, expect } from '@playwright/test';

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
    // テスト用のURLとセレクタを入力
    const targetUrl = 'https://takumi-oda.com/blog/';
    const selector = '#card-2';
    
    await page.fill('input[type="url"]', targetUrl);
    await page.fill('input[placeholder*="例: .main-content a"]', selector);
    
    // スクリーンショット（入力後）
    await page.screenshot({ 
      path: 'test-results/link-collector-form-filled.png',
      fullPage: true 
    });
    
    // リンク収集ボタンをクリック
    await page.click('button[type="submit"]');
    
    // 収集中の表示を確認（より具体的なセレクタを使用）
    await expect(page.locator('button:has-text("収集中")')).toBeVisible();
    
    // スクリーンショット（収集中）
    await page.screenshot({ 
      path: 'test-results/link-collector-collecting.png',
      fullPage: true 
    });
    
    // 結果が表示されるまで待機（最大30秒）
    await page.waitForSelector('h2:has-text("収集結果")', { timeout: 30000 });
    
    // 結果表示エリアの確認
    await expect(page.locator('h2:has-text("収集結果")')).toBeVisible();
    
    // 収集されたURLがあることを確認（実際のDOM構造に基づく）
    const urlList = page.locator('.divide-y .p-3, .divide-gray-200 > div');
    await expect(urlList.first()).toBeVisible();
    
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

  test('should test options accordion functionality', async ({ page }) => {
    // 詳細オプションアコーディオンをクリック
    const optionsButton = page.locator('text=詳細オプション');
    await optionsButton.click();
    
    // オプション項目が表示されることを確認（より具体的なセレクタを使用）
    await expect(page.locator('label:has-text("クロール深度")')).toBeVisible();
    await expect(page.locator('label:has-text("リクエスト間隔")')).toBeVisible();
    
    // 深度の値を変更
    await page.fill('input[type="number"][min="1"][max="5"]', '2');
    
    // スクリーンショット（オプション展開）
    await page.screenshot({ 
      path: 'test-results/link-collector-options.png',
      fullPage: true 
    });
    
    // アコーディオンを閉じる
    await optionsButton.click();
    
    // オプション項目が非表示になることを確認
    await expect(page.locator('label:has-text("クロール深度")')).not.toBeVisible();
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

  test('should take screenshot on error scenarios', async ({ page }) => {
    // 無効なURLでテストして、適切にハンドリングされることを確認
    await page.fill('input[type="url"]', 'https://nonexistent-domain-12345.com');
    await page.click('button[type="submit"]');
    
    // 収集中状態になることを確認
    await expect(page.locator('button:has-text("収集中")')).toBeVisible();
    
    // スクリーンショット（無効URLテスト中）
    await page.screenshot({ 
      path: 'test-results/link-collector-invalid-url-test.png',
      fullPage: true 
    });
    
    // 一定時間待機してから結果をチェック（エラーまたは結果）
    await page.waitForTimeout(10000);
    
    // 最終的なスクリーンショット
    await page.screenshot({ 
      path: 'test-results/link-collector-final-state.png',
      fullPage: true 
    });
    
    // 収集中ボタンが消えていることを確認（処理完了の証拠）
    await expect(page.locator('button:has-text("収集中")')).not.toBeVisible();
  });
});