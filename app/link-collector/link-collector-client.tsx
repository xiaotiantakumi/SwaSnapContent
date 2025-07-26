'use client';

import { useState } from 'react';
import LinkCollectorForm from '../components/link-collector-form';
import URLListDisplay from '../components/url-list-display';
import { useLinkCollector } from '../hooks/useLinkCollector';
import { CollectionOptions } from '../types/link-collector';

export default function LinkCollectorClient() {
  const {
    collectedUrls,
    selectedUrls,
    isCollecting,
    error,
    stats,
    collectLinks,
    toggleUrlSelection,
    selectAll,
    copySelectedUrls,
    exportResults,
    clearResults,
  } = useLinkCollector();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCollect = async (url: string, selector: string, options: CollectionOptions) => {
    setSuccessMessage(null);
    await collectLinks(url, selector, options);
  };

  const handleCopy = async (format: Parameters<typeof copySelectedUrls>[0]) => {
    try {
      await copySelectedUrls(format);
      setSuccessMessage(`${selectedUrls.size}個のURLをコピーしました`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {/* Collection Form */}
      <LinkCollectorForm
        onCollect={handleCollect}
        isCollecting={isCollecting}
      />

      {/* Results Display */}
      {collectedUrls.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              収集結果
            </h2>
            <button
              onClick={clearResults}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              結果をクリア
            </button>
          </div>
          
          <URLListDisplay
            urls={collectedUrls}
            selectedUrls={selectedUrls}
            onToggleSelection={toggleUrlSelection}
            onSelectAll={selectAll}
            onCopy={handleCopy}
            onExport={exportResults}
            stats={stats || undefined}
          />
        </div>
      )}

      {/* Loading State */}
      {isCollecting && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            リンクを収集中です... サーバーの負荷を避けるため、少し時間がかかる場合があります。
          </div>
        </div>
      )}

      {/* Help Text */}
      {collectedUrls.length === 0 && !isCollecting && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            使い方
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• <strong>ターゲットURL:</strong> リンクを収集したいウェブページのURLを入力してください</li>
            <li>• <strong>CSSセレクタ:</strong> 特定の要素内のリンクのみを収集したい場合に指定します（例: .content a, #main a）</li>
            <li>• <strong>クロール深度:</strong> リンクをどこまで深くたどるかを設定します（1-5）</li>
            <li>• <strong>リクエスト間隔:</strong> サーバーへの負荷を避けるための待機時間を設定します</li>
            <li>• 収集後は、フィルタ機能で不要なURLを除外し、チェックボックスで必要なURLを選択してコピーできます</li>
            <li>• NotebookLMで使用する場合は、改行区切りまたはスペース区切りを選択できます</li>
          </ul>
        </div>
      )}
    </div>
  );
}