'use client';

import { useState } from 'react';
import { CollectionOptions } from '../types/link-collector';

interface LinkCollectorFormProps {
  onCollect: (url: string, selector: string, options: CollectionOptions) => Promise<void>;
  isCollecting: boolean;
}

interface OptionsAccordionProps {
  options: CollectionOptions;
  onChange: (options: CollectionOptions) => void;
  disabled: boolean;
}

function OptionsAccordion({ options, onChange, disabled }: OptionsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        詳細オプション {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="px-4 py-4 border-t border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              クロール深度
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={options.depth}
              onChange={(e) => onChange({ ...options, depth: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={disabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              リンクをどこまで深くたどるか（1-5）
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              リクエスト間隔（ミリ秒）
            </label>
            <input
              type="number"
              min="500"
              max="5000"
              step="100"
              value={options.delayMs}
              onChange={(e) => onChange({ ...options, delayMs: parseInt(e.target.value) || 1000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={disabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              サーバーへの負荷を避けるための待機時間
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LinkCollectorForm({ onCollect, isCollecting }: LinkCollectorFormProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [options, setOptions] = useState<CollectionOptions>({
    depth: 1,
    delayMs: 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim() || isCollecting) return;
    
    await onCollect(targetUrl, selector, options);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ターゲットURL *
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isCollecting}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSSセレクタ（オプション）
            </label>
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="例: .main-content a, #sidebar a"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isCollecting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              特定の要素内のリンクのみを収集したい場合に指定
            </p>
          </div>
          
          <OptionsAccordion 
            options={options} 
            onChange={setOptions} 
            disabled={isCollecting} 
          />
          
          <button
            type="submit"
            disabled={isCollecting || !targetUrl.trim()}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isCollecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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