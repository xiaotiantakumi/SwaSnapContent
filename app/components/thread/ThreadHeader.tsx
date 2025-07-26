'use client';

import { useState } from 'react';

import { useThread } from '../../contexts/ThreadContext';

import { ThreadSelector } from './ThreadSelector';
// import { Tooltip } from '../ui/Tooltip';

export function ThreadHeader() {
  const { activeThread, threads, createThread } = useThread();
  const [isThreadSelectorOpen, setIsThreadSelectorOpen] = useState(false);

  const handleCreateFirstThread = async () => {
    await createThread();
    // プロジェクト作成後にファイル追加を促すため、少し遅延してファイルダイアログトリガーイベントを発火
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('trigger-file-dialog'));
    }, 300);
  };

  // If no threads exist, show initial setup
  if (threads.length === 0) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Markdownビューア
        </div>
        <button
          onClick={handleCreateFirstThread}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          最初のプロジェクトを作成
        </button>
      </div>
    );
  }

  // If threads exist but none is active, show thread selector
  if (!activeThread) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Markdownビューア
        </div>
        <button
          onClick={() => setIsThreadSelectorOpen(true)}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
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
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsThreadSelectorOpen(true)}
            className="group flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-1.5 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <span className="max-w-48 truncate text-lg font-semibold text-gray-700 dark:text-gray-300">
              {activeThread.name}
            </span>
            <svg className="size-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Thread info */}
          <div className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
            {activeThread.files.length}個のファイル
          </div>
        </div>
      </div>

      <ThreadSelector
        isOpen={isThreadSelectorOpen}
        onClose={() => setIsThreadSelectorOpen(false)}
      />
    </>
  );
}