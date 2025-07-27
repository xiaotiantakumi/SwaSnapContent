import { type Page } from '@playwright/test';

interface CollectionSuccessResponse {
  success: true;
  data: {
    allCollectedUrls: string[];
    linkRelationships: Array<{
      found: string;
      source: string;
    }>;
    stats: {
      totalPages: number;
      totalLinks: number;
      uniqueLinks: number;
      processingTime: number;
    };
  };
}

interface CollectionErrorResponse {
  success: false;
  error: string;
}

type CollectionResponse = CollectionSuccessResponse | CollectionErrorResponse;

export async function fillLinkCollectorForm(
  page: Page,
  url: string,
  selector?: string
): Promise<void> {
  // URLフィールドに入力
  const urlInput = page.locator('input[type="url"]');
  await urlInput.fill(url);
  await urlInput.blur(); // フォーカスを外してバリデーションをトリガー

  // セレクタが提供されていれば入力
  if (selector) {
    const selectorInput = page.locator('input[placeholder*="例: .main-content a"]');
    await selectorInput.fill(selector);
    await selectorInput.blur();
  }

  // フォームの状態が安定するまで少し待つ
  await page.waitForTimeout(100);
}

export async function waitForCollectionToComplete(
  page: Page,
  expectSuccess: boolean = true
): Promise<void> {
  const submitButton = page.locator('button[type="submit"]');

  // ボタンが再度有効になるまで待つ
  await submitButton.waitFor({ state: 'visible' });
  await submitButton.waitFor({ state: 'attached' });

  if (expectSuccess) {
    // 成功時は結果が表示されるまで待つ
    await page.waitForSelector('h2:has-text("収集結果")', {
      state: 'visible',
      timeout: 30000
    });
  } else {
    // エラー時はエラーメッセージが表示されるまで待つ
    await page.waitForSelector('text=エラー:', {
      state: 'visible',
      timeout: 30000
    });
  }

  // ボタンが再度有効になることを確認
  await submitButton.waitFor({ state: 'visible' });
  await submitButton.waitFor({ state: 'attached' });
  
  // ボタンのテキストが元に戻ることを確認
  const buttonText = await submitButton.textContent();
  if (!buttonText?.includes('リンクを収集')) {
    throw new Error(`Button text did not reset: ${buttonText}`);
  }
}

export async function mockCollectionAPI(
  page: Page,
  responseData: CollectionResponse,
  statusCode: number = 200,
  delay: number = 500
): Promise<void> {
  await page.route('**/api/collectLinks', async route => {
    // 実際のAPIコールのように遅延を入れる
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });
}

export function createSuccessResponse(urls: string[], source: string = 'https://takumi-oda.com'): CollectionSuccessResponse {
  return {
    success: true,
    data: {
      allCollectedUrls: urls,
      linkRelationships: urls.map(url => ({
        found: url,
        source: source
      })),
      stats: {
        totalPages: 1,
        totalLinks: urls.length,
        uniqueLinks: urls.length,
        processingTime: 1500
      }
    }
  };
}

export function createErrorResponse(error: string): CollectionErrorResponse {
  return {
    success: false,
    error: error
  };
}