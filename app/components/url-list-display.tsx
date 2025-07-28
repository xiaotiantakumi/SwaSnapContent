'use client';

import { useState } from 'react';

import { type CollectedLink, type NotebookLMFormat } from '../types/link-collector';
import { isUrlExcluded } from '../utils/url-pattern-matching';

interface URLListDisplayProps {
  urls: CollectedLink[];
  selectedUrls: Set<string>;
  onToggleSelection: (url: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onCopy: (format: NotebookLMFormat) => Promise<void>;
  onExport: () => void;
  stats?: {
    totalPages: number;
    totalLinks: number;
    uniqueLinks: number;
    processingTime: number;
  };
}

interface FilterPanelProps {
  filterText: string;
  onFilterChange: (text: string) => void;
  excludePatterns: string[];
  onExcludePatternsChange: (patterns: string[]) => void;
}

function FilterPanel({ filterText, onFilterChange, excludePatterns, onExcludePatternsChange }: FilterPanelProps) {
  const [newPattern, setNewPattern] = useState('');

  const addPattern = () => {
    if (newPattern.trim() && !excludePatterns.includes(newPattern.trim())) {
      onExcludePatternsChange([...excludePatterns, newPattern.trim()]);
      setNewPattern('');
    }
  };

  const removePattern = (pattern: string) => {
    onExcludePatternsChange(excludePatterns.filter(p => p !== pattern));
  };

  return (
    <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">フィルタ</h4>
      
      <div>
        <label htmlFor="url-search" className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
          URL検索
        </label>
        <input
          id="url-search"
          type="text"
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="URLで絞り込み..."
          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
      </div>
      
      <div>
        <label htmlFor="exclude-pattern" className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
          除外パターン
        </label>
        <div className="flex space-x-2">
          <input
            id="exclude-pattern"
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="除外パターンを追加..."
            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && addPattern()}
          />
          <button
            onClick={addPattern}
            className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
          >
            追加
          </button>
        </div>
        
        {excludePatterns.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {excludePatterns.map((pattern) => (
              <span
                key={pattern}
                className="inline-flex items-center rounded bg-red-100 px-2 py-1 text-xs text-red-800"
              >
                {pattern}
                <button
                  onClick={() => removePattern(pattern)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function URLListDisplay({
  urls,
  selectedUrls,
  onToggleSelection,
  onSelectAll: _onSelectAll,
  onCopy,
  stats
}: URLListDisplayProps): JSX.Element {
  const [filterText, setFilterText] = useState('');
  const [excludePatterns, setExcludePatterns] = useState<string[]>([]);
  const [copyFormat, setCopyFormat] = useState<NotebookLMFormat>({
    separator: 'newline',
    includeTitle: false,
    includeSource: false,
  });

  // 除外パターン変更時に該当URLの選択を自動解除する関数
  const handleExcludePatternsChange = (patterns: string[]) => {
    setExcludePatterns(patterns);
    
    // 新しく除外されるURLを特定
    const excludedUrls = urls.filter(item => isUrlExcluded(item.url, patterns))
      .map(item => item.url);
    
    // 除外されたURLの選択を解除
    excludedUrls.forEach(url => {
      if (selectedUrls.has(url)) {
        onToggleSelection(url);
      }
    });
  };

  // Apply filters
  const filteredUrls = urls.filter(item => {
    // Text filter
    if (filterText && !item.url.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }

    // Exclude patterns - 共通ユーティリティ関数を使用
    if (isUrlExcluded(item.url, excludePatterns)) {
      return false;
    }

    return true;
  });

  const allSelected = filteredUrls.length > 0 && filteredUrls.every(item => selectedUrls.has(item.url));
  const someSelected = filteredUrls.some(item => selectedUrls.has(item.url));

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered URLs
      filteredUrls.forEach(item => {
        if (selectedUrls.has(item.url)) {
          onToggleSelection(item.url);
        }
      });
    } else {
      // Select all filtered URLs
      filteredUrls.forEach(item => {
        if (!selectedUrls.has(item.url)) {
          onToggleSelection(item.url);
        }
      });
    }
  };

  const handleCopy = async () => {
    await onCopy(copyFormat);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      {/* Stats Header */}
      {stats ? <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            収集結果
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400">処理時間: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.processingTime}ms</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">総ページ数: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.totalPages}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">総リンク数: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.totalLinks}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">ユニーク数: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.uniqueLinks}</span>
            </div>
          </div>
        </div> : null}

      {/* Filter Panel */}
      <FilterPanel
        filterText={filterText}
        onFilterChange={setFilterText}
        excludePatterns={excludePatterns}
        onExcludePatternsChange={handleExcludePatternsChange}
      />

      {/* Action Panel */}
      <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={handleSelectAll}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                全選択 ({selectedUrls.size}/{filteredUrls.length})
              </span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={copyFormat.separator}
              onChange={(e) => setCopyFormat({ ...copyFormat, separator: e.target.value as 'space' | 'newline' })}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="newline">改行区切り</option>
              <option value="space">スペース区切り</option>
            </select>
            
            <button
              onClick={handleCopy}
              disabled={selectedUrls.size === 0}
              className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              コピー ({selectedUrls.size})
            </button>
          </div>
        </div>
      </div>

      {/* URL List */}
      <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
        {filteredUrls.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {urls.length === 0 ? 'URLがありません' : 'フィルタ条件に一致するURLがありません'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredUrls.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedUrls.has(item.url)}
                  onChange={() => onToggleSelection(item.url)}
                  className="mt-1"
                />
                
                <div className="min-w-0 flex-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="break-all rounded text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {item.url}
                  </a>
                  
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    ソース: {item.source} | 深度: {item.depth}
                    {item.title ? ` | タイトル: ${item.title}` : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}