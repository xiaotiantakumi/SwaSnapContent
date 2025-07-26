'use client';

import { type ArticleOutput } from '../utils/extract-content';

interface ArticleDisplayProps {
  article: ArticleOutput;
}

export default function ArticleDisplay({ article }: ArticleDisplayProps) {
  return (
    <div className="mt-8 space-y-4">
      {article.title && (
        <h2 className="text-2xl font-semibold">{article.title}</h2>
      )}

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="text-lg font-medium">抽出されたコンテンツ：</h3>
      </div>

      <div className="h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4">
        {article.textContent || 'テキストコンテンツがありません'}
      </div>

      {/* アクション選択セクションはこのコンポーネントの外にあります */}

      {article.siteName && (
        <div className="text-sm text-gray-600">
          サイト名: {article.siteName}
        </div>
      )}

      {article.byline && (
        <div className="text-sm text-gray-600">著者: {article.byline}</div>
      )}
    </div>
  );
}
