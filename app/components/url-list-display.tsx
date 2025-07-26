'use client';

import { useState } from 'react';
import { CollectedLink, NotebookLMFormat } from '../types/link-collector';

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
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">フィルタ</h4>
      
      <div>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          URL検索
        </label>
        <input
          type="text"
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="URLで絞り込み..."
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          除外パターン
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="除外パターンを追加..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && addPattern()}
          />
          <button
            onClick={addPattern}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            追加
          </button>
        </div>
        
        {excludePatterns.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {excludePatterns.map((pattern) => (
              <span
                key={pattern}
                className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
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
  onCopy,
  stats
}: URLListDisplayProps) {
  const [filterText, setFilterText] = useState('');
  const [excludePatterns, setExcludePatterns] = useState<string[]>([]);
  const [copyFormat, setCopyFormat] = useState<NotebookLMFormat>({
    separator: 'newline',
    includeTitle: false,
    includeSource: false,
  });

  // Apply filters
  const filteredUrls = urls.filter(item => {
    // Text filter
    if (filterText && !item.url.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }

    // Exclude patterns
    if (excludePatterns.some(pattern => {
      try {
        return new RegExp(pattern, 'i').test(item.url);
      } catch {
        return item.url.toLowerCase().includes(pattern.toLowerCase());
      }
    })) {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Stats Header */}
      {stats && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            収集結果
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        filterText={filterText}
        onFilterChange={setFilterText}
        excludePatterns={excludePatterns}
        onExcludePatternsChange={setExcludePatterns}
      />

      {/* Action Panel */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
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
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="newline">改行区切り</option>
              <option value="space">スペース区切り</option>
            </select>
            
            <button
              onClick={handleCopy}
              disabled={selectedUrls.size === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              コピー ({selectedUrls.size})
            </button>
          </div>
        </div>
      </div>

      {/* URL List */}
      <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
        {filteredUrls.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {urls.length === 0 ? 'URLがありません' : 'フィルタ条件に一致するURLがありません'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredUrls.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start space-x-3"
              >
                <input
                  type="checkbox"
                  checked={selectedUrls.has(item.url)}
                  onChange={() => onToggleSelection(item.url)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {item.url}
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    ソース: {item.source} | 深度: {item.depth}
                    {item.title && ` | タイトル: ${item.title}`}
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