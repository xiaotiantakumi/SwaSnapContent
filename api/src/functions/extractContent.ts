import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
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
    // JSDOMインスタンスをtryブロックの外で宣言し、finallyでアクセスできるようにする
    let doc: JSDOM | null = null;

    // 関数の開始をログに記録
    context.log('extractContent: 関数が開始されました');

    try {
      // リクエストボディからURLを取得
      const requestBody = (await request.json()) as { url?: string };
      const url = requestBody.url;

      if (!url) {
        context.warn('extractContent: URLが指定されていません');
        return {
          status: 400,
          jsonBody: { error: 'URLが必要です' },
        };
      }

      context.log(`extractContent: URL "${url}" の処理を開始します`);

      // URLからHTMLコンテンツを取得
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLContentExtractor/1.0;)',
        },
      });

      if (!response.ok) {
        context.error(
          `extractContent: URLのフェッチに失敗: ${response.status} ${response.statusText}`
        );

        // 403エラーの場合は、ユーザーフレンドリーなメッセージを返す
        if (response.status === 403) {
          return {
            status: 403,
            jsonBody: {
              error: 'アクセスが拒否されました',
              message:
                'このサイトはコンテンツの自動取得を許可していません。サイト運営者の方針によりAPIからのアクセスがブロックされています。',
            },
          };
        }

        return {
          status: 400,
          jsonBody: {
            error: `URLからのフェッチに失敗しました: ${response.status} ${response.statusText}`,
          },
        };
      }

      context.log(
        `extractContent: URLからHTMLを取得しました (ステータスコード: ${response.status})`
      );
      const html = await response.text();

      // JSDOMからの不要な出力を抑制するためのVirtualConsole
      const virtualConsole = new VirtualConsole();

      // JSDOMのメモリ使用量を減らすオプション
      const jsdomOptions = {
        url,
        // TypeScriptの型に合わせてリソース設定
        runScripts: 'outside-only' as const,
        pretendToBeVisual: false,
        virtualConsole, // JSDOMからの不要な出力を抑制するために追加
      };

      // JSDOMを使ってHTMLをDOMオブジェクトに変換
      context.log('extractContent: JSDOMでHTMLを解析中...');
      doc = new JSDOM(html, jsdomOptions);

      // Readabilityインスタンスを作成して記事コンテンツを抽出
      const reader = new Readability(doc.window.document, {
        keepClasses: false,
      });

      context.log('extractContent: Readabilityで記事を抽出中...');
      const article = reader.parse();

      if (!article) {
        context.warn('extractContent: 記事コンテンツを抽出できませんでした');
        return {
          status: 404,
          jsonBody: { error: 'コンテンツを抽出できませんでした' },
        };
      }

      // HTMLからlang属性を抽出
      const lang = doc.window.document.documentElement.lang || null;
      context.log(`extractContent: 言語属性を検出: ${lang || 'なし'}`);

      // メタデータからpublishedTimeを抽出
      let publishedTime: string | null = null;
      const metaTags = doc.window.document.querySelectorAll('meta');

      // NodeListをArrayに変換して処理する（下位互換性のため）
      Array.from(metaTags).forEach((meta) => {
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
        }
      });

      if (publishedTime) {
        context.log(`extractContent: 公開日時を検出: ${publishedTime}`);
      }

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

      context.log(
        `extractContent: 記事の抽出に成功しました (タイトル: "${
          article.title || '不明'
        }", 長さ: ${article.length || 0}文字)`
      );

      // 成功レスポンスを返す
      return {
        status: 200,
        jsonBody: typedArticle,
      };
    } catch (error) {
      context.error('extractContent: API エラーが発生しました', error);

      return {
        status: 500,
        jsonBody: {
          error: 'サーバーエラーが発生しました',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    } finally {
      // JSDOMインスタンスが作成されていれば、ここで確実に解放する
      if (doc) {
        doc.window.close();
        context.log('extractContent: JSDOM windowを解放しました');
      }
    }
  },
});
