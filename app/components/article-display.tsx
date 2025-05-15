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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-medium">抽出されたコンテンツ：</h3>
      </div>

      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 whitespace-pre-wrap h-40 overflow-y-auto">
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
