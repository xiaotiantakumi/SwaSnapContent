'use client';

import { useState, FormEvent } from 'react';
import { type ArticleOutput } from '../utils/extract-content';

export default function ExtractForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleOutput | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isTrimCopied, setIsTrimCopied] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // バリデーション
    if (!url || !url.trim()) {
      setError('URLを入力してください');
      return;
    }

    // URLの形式をチェック
    try {
      const parsedUrl = new URL(url);
      // HTTP/HTTPSプロトコルに限定
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setError('HTTPまたはHTTPSのURLを入力してください');
        return;
      }
    } catch (e) {
      setError('有効なURLを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setArticle(null);

      // Azure Static Web Apps APIを呼び出す
      // ローカル開発時: /api/extractContent
      // 本番環境: /api/extractContent
      const response = await fetch('/api/extractContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIエラーが発生しました');
      }

      const result = await response.json();

      if (!result) {
        setError('コンテンツを抽出できませんでした');
        return;
      }

      setArticle(result);
    } catch (error) {
      setError(
        'エラーが発生しました: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!article?.textContent) return;

    try {
      await navigator.clipboard.writeText(article.textContent);
      setIsCopied(true);
      setIsTrimCopied(false);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  };

  const handleTrimCopy = async () => {
    if (!article?.textContent) return;

    try {
      // 複数の空白、改行をすべて単一のスペースに置換
      const trimmedContent = article.textContent.replace(/\s+/g, ' ').trim();

      await navigator.clipboard.writeText(trimmedContent);
      setIsTrimCopied(true);
      setIsCopied(false);
      setTimeout(() => setIsTrimCopied(false), 2000);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URLを入力"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-6 py-2 text-white rounded-md ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? '抽出中...' : '抽出'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
            {error}
          </div>
        )}
      </form>

      {article && (
        <div className="mt-8 space-y-4">
          {article.title && (
            <h2 className="text-2xl font-semibold">{article.title}</h2>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">抽出されたコンテンツ：</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleTrimCopy}
                className={`px-4 py-1 text-sm rounded-md transition-colors ${
                  isTrimCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title="複数の空白や改行を単一のスペースに置き換えてコピーします"
              >
                {isTrimCopied ? 'コピーしました！' : '整形してコピー'}
              </button>
              <button
                onClick={handleCopy}
                className={`px-4 py-1 text-sm rounded-md transition-colors ${
                  isCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isCopied ? 'コピーしました！' : 'コピー'}
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 whitespace-pre-wrap h-96 overflow-y-auto">
            {article.textContent || 'テキストコンテンツがありません'}
          </div>

          {article.siteName && (
            <div className="text-sm text-gray-600">
              サイト名: {article.siteName}
            </div>
          )}

          {article.byline && (
            <div className="text-sm text-gray-600">著者: {article.byline}</div>
          )}
        </div>
      )}
    </div>
  );
}
