import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Article } from '../models/article';

// URLからメインコンテンツを抽出するAPI
export const extractContent = app.http('extractContent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'extractContent', // 明示的にルートを指定
  handler: async (
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      // リクエストボディからURLを取得
      const requestBody = (await request.json()) as { url?: string };
      const url = requestBody.url;

      if (!url) {
        return {
          status: 400,
          jsonBody: { error: 'URLが必要です' },
        };
      }

      // URLからHTMLコンテンツを取得
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLContentExtractor/1.0;)',
        },
      });

      if (!response.ok) {
        return {
          status: 400,
          jsonBody: {
            error: `URLからのフェッチに失敗しました: ${response.status} ${response.statusText}`,
          },
        };
      }

      const html = await response.text();

      // JSDOMのメモリ使用量を減らすオプション
      const jsdomOptions = {
        url,
        // TypeScriptの型に合わせてリソース設定
        runScripts: 'outside-only' as const,
        pretendToBeVisual: false,
        virtualConsole: undefined,
      };

      // JSDOMを使ってHTMLをDOMオブジェクトに変換
      const doc = new JSDOM(html, jsdomOptions);

      // Readabilityインスタンスを作成して記事コンテンツを抽出
      // charThreshold: 500はReadabilityのデフォルト値。特定の理由がある場合を除き省略可能
      const reader = new Readability(doc.window.document, {
        keepClasses: false,
      });

      const article = reader.parse();

      if (!article) {
        // 不要なDOMリソースを解放
        doc.window.close();

        return {
          status: 404,
          jsonBody: { error: 'コンテンツを抽出できませんでした' },
        };
      }

      // HTMLからlang属性を抽出
      const lang = doc.window.document.documentElement.lang || null;

      // メタデータからpublishedTimeを抽出
      let publishedTime: string | null = null;
      const metaTags = doc.window.document.querySelectorAll('meta');
      for (const meta of metaTags) {
        // 一般的な日付メタタグを確認
        const property = meta.getAttribute('property');
        const name = meta.getAttribute('name');
        if (
          property === 'article:published_time' ||
          property === 'og:published_time' ||
          name === 'publishedDate' ||
          name === 'date'
        ) {
          publishedTime = meta.getAttribute('content');
          if (publishedTime) break;
        }
      }

      // 不要なDOMリソースを解放
      doc.window.close();

      // 抽出結果をTypedに変換
      const typedArticle: Article = {
        title: article.title || null,
        content: article.content || '',
        textContent: article.textContent || null,
        length: article.length || 0,
        excerpt: article.excerpt || null,
        byline: article.byline || null,
        dir: article.dir || null,
        lang: lang,
        siteName: article.siteName || null,
        publishedTime: publishedTime,
      };

      // 成功レスポンスを返す
      return {
        status: 200,
        jsonBody: typedArticle,
      };
    } catch (error) {
      context.error('API エラー:', error);

      return {
        status: 500,
        jsonBody: {
          error: 'サーバーエラーが発生しました',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
});
