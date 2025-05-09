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
      const reader = new Readability(doc.window.document, {
        keepClasses: false,
        charThreshold: 500,
      });

      const article = reader.parse();

      // 不要なDOMリソースを解放
      doc.window.close();

      if (!article) {
        return {
          status: 404,
          jsonBody: { error: 'コンテンツを抽出できませんでした' },
        };
      }

      // 抽出結果をTypedに変換
      const typedArticle: Article = {
        title: article.title,
        content: article.content || '',
        textContent: article.textContent,
        length: article.length || 0,
        excerpt: article.excerpt,
        byline: article.byline,
        dir: article.dir,
        lang: article.lang,
        siteName: article.siteName,
        publishedTime: article.publishedTime,
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
