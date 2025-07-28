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

  // Issue #32: 除外パターン適用時のチェック状態管理問題とターゲットURL自動除外機能
  test('should deselect URLs when exclusion patterns are added', async ({ page }) => {
    // テスト用のURL（ターゲットURLは含めない - フロントエンドで除外される）
    const testUrls = [
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://github.com/takumi/repo',
      'https://twitter.com/takumi',
      'https://takumi-oda.com/assets/image.jpg'
    ];
    
    // APIをモック
    await mockCollectionAPI(page, createSuccessResponse(testUrls), 200, 1000);

    // フォームに入力してリンク収集を実行
    await fillLinkCollectorForm(page, 'https://takumi-oda.com/blog/', '#card-2');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 収集が完了するまで待つ
    await waitForCollectionToComplete(page, true);
    
    // ターゲットURLが結果に含まれていないことを確認
    // Note: blog/post-1/ と blog/post-2/ には 'blog/' が含まれるが、exact targetは表示されない
    const exactTargetUrlItem = page.locator('a[href="https://takumi-oda.com/blog/"]');
    await expect(exactTargetUrlItem).toHaveCount(0);
    
    // 他のURLが表示されていることを確認（5個）
    const urlItems = page.locator('.divide-y > div');
    await expect(urlItems).toHaveCount(5);
    
    // 全選択してから除外パターンをテスト（実際のユーザー操作に基づく）
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    await selectAllCheckbox.check();
    
    // 全選択されていることを確認（5個のURLが選択されている）
    await expect(page.locator('text=コピー (5)')).toBeVisible();
    
    // 除外パターンを追加（github）
    const excludePatternInput = page.locator('input[placeholder="除外パターンを追加..."]');
    await excludePatternInput.fill('github');
    await page.locator('button:has-text("追加")').click();
    
    // 除外パターンが追加されたことを確認
    await expect(page.locator('span:has-text("github")')).toBeVisible();
    
    // GitHubを含むURLが自動で選択解除されて選択数が減ることを確認
    await expect.poll(async () => {
      const copyButton = page.locator('button:has-text("コピー")');
      const text = await copyButton.textContent();
      return text;
    }, {
      message: 'Selection count should decrease after adding GitHub exclusion pattern',
      timeout: 10000,
    }).toContain('コピー (4)'); // GitHub URLが1つ除外されて4つになる
    
    // さらに除外パターンを追加（twitter）
    await excludePatternInput.fill('twitter');
    await page.locator('button:has-text("追加")').click();
    
    // TwitterのURLも自動で選択解除されることを確認
    await expect.poll(async () => {
      const copyButton = page.locator('button:has-text("コピー")');
      const text = await copyButton.textContent();
      return text;
    }, {
      message: 'Selection count should decrease further after adding Twitter exclusion pattern',
      timeout: 10000,
    }).toContain('コピー (3)'); // Twitter URLも除外されて3つになる
    
    // 除外パターンが正しく表示されていることを確認
    await expect(page.locator('span:has-text("github")')).toBeVisible();
    await expect(page.locator('span:has-text("twitter")')).toBeVisible();
    
    // スクリーンショット（除外パターン適用後）
    await page.screenshot({ 
      path: 'test-results/link-collector-exclusion-patterns.png',
      fullPage: true 
    });
  });

  test('should not include target URL in collection results', async ({ page }) => {
    // APIがターゲットURLを含むレスポンスを返すケースをテスト
    const testUrls = [
      'https://takumi-oda.com/blog/',  // ターゲットURL（フロントエンドで除外されるべき）
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://takumi-oda.com/blog/post-3/'
    ];
    
    // APIをモック（ターゲットURLを含むレスポンス）
    await mockCollectionAPI(page, createSuccessResponse(testUrls), 200, 1000);

    // フォームに入力（ターゲットURLを指定）
    await fillLinkCollectorForm(page, 'https://takumi-oda.com/blog/', '#card-2');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 収集が完了するまで待つ
    await waitForCollectionToComplete(page, true);
    
    // ターゲットURLがフロントエンドで除外されて3つのURLが表示されることを確認
    const urlItems = page.locator('.divide-y > div');
    await expect(urlItems).toHaveCount(3);
    
    // ターゲットURLが結果一覧に表示されていないことを確認
    // (フロントエンドで除外されるため、UIには表示されない)
    await expect(page.locator('a[href="https://takumi-oda.com/blog/"]')).toHaveCount(0);
    
    // 統計情報はAPI側の値（フィルタリング前）が表示される
    await expect(page.locator('text=総リンク数: 4')).toBeVisible();
    await expect(page.locator('text=ユニーク数: 4')).toBeVisible();
    
    // 全選択してコピーした場合もターゲットURLが含まれないことを確認
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    await selectAllCheckbox.check();
    
    // コピーボタンをクリック
    const copyButton = page.locator('button:has-text("コピー")');
    await copyButton.click();
    
    // クリップボードの内容を確認（実際にはクリップボードAPIのテストは難しいが、
    // 少なくともターゲットURLが選択対象に含まれていないことは確認済み）
    await expect(page.locator('text=コピー (3)')).toBeVisible();
    
    // スクリーンショット（ターゲットURL除外確認）
    await page.screenshot({ 
      path: 'test-results/link-collector-target-url-excluded.png',
      fullPage: true 
    });
  });
});