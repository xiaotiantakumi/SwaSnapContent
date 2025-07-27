'use client';

import { useState } from 'react';

import { type CollectionOptions } from '../types/link-collector';

interface LinkCollectorFormProps {
  onCollect: (url: string, selector: string, options: CollectionOptions) => Promise<void>;
  isCollecting: boolean;
}



export default function LinkCollectorForm({ onCollect, isCollecting }: LinkCollectorFormProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [selector, setSelector] = useState('');
  const options: CollectionOptions = {
    depth: 1,
    delayMs: 1000,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim() || isCollecting) return;
    
    await onCollect(targetUrl, selector, options);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="space-y-4">
          <div>
            <label htmlFor="target-url" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ターゲットURL *
            </label>
            <input
              id="target-url"
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              disabled={isCollecting}
              required
            />
          </div>
          
          <div>
            <label htmlFor="css-selector" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CSSセレクタ（オプション）
            </label>
            <input
              id="css-selector"
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="例: .main-content a, #sidebar a"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              disabled={isCollecting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              特定の要素内のリンクのみを収集したい場合に指定
            </p>
          </div>
          
          
          <button
            type="submit"
            disabled={isCollecting || !targetUrl.trim()}
            className="w-full rounded-md bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCollecting ? (
              <span className="flex items-center justify-center">
                <svg className="-ml-1 mr-3 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                収集中...
              </span>
            ) : (
              'リンクを収集'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}