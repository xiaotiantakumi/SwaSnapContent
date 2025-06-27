'use client';

import { useState } from 'react';
import { useThread } from '../../contexts/ThreadContext';
import { ThreadSelector } from './ThreadSelector';
import { Tooltip } from '../ui/Tooltip';

export function ThreadHeader() {
  const { activeThread, threads, createThread } = useThread();
  const [isThreadSelectorOpen, setIsThreadSelectorOpen] = useState(false);

  const handleCreateFirstThread = async () => {
    await createThread();
  };

  // If no threads exist, show initial setup
  if (threads.length === 0) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Markdownビューア
        </div>
        <button
          onClick={handleCreateFirstThread}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          最初のプロジェクトを作成
        </button>
      </div>
    );
  }

  // If threads exist but none is active, show thread selector
  if (!activeThread) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Markdownビューア
        </div>
        <button
          onClick={() => setIsThreadSelectorOpen(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          プロジェクトを選択
        </button>
        <ThreadSelector
          isOpen={isThreadSelectorOpen}
          onClose={() => setIsThreadSelectorOpen(false)}
        />
      </div>
    );
  }

  // Normal header with active thread
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Markdownビューア
          </div>
          <div className="text-gray-400 dark:text-gray-500">•</div>
          <button
            onClick={() => setIsThreadSelectorOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-48">
              {activeThread.name}
            </span>
            <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Thread info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {activeThread.files.length}個のファイル
          </div>

          {/* Thread selector button */}
          <Tooltip content="プロジェクト切り替え" position="bottom">
            <button
              onClick={() => setIsThreadSelectorOpen(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="プロジェクト切り替え"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a1 1 0 011-1h1m-1 1v1a1 1 0 001 1M9 7h1" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      <ThreadSelector
        isOpen={isThreadSelectorOpen}
        onClose={() => setIsThreadSelectorOpen(false)}
      />
    </>
  );
}