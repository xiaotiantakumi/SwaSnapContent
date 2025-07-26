'use client';

import { useState } from 'react';

import { useThread } from '../../contexts/ThreadContext';
import type { Thread } from '../../types/thread';

interface ThreadSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThreadSelector({ isOpen, onClose }: ThreadSelectorProps) {
  const { 
    threads, 
    activeThread, 
    createThread, 
    switchThread, 
    deleteThread,
    updateThreadName 
  } = useThread();
  
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateNewThread = async () => {
    setIsCreating(true);
    try {
      await createThread();
      onClose();
      // プロジェクト作成後にファイル追加を促すため、少し遅延してファイルダイアログトリガーイベントを発火
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-file-dialog'));
      }, 300);
    } catch (error) {
      console.error('Failed to create thread:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchThread = (threadId: string) => {
    switchThread(threadId);
    onClose();
  };

  const handleStartEdit = (thread: Thread) => {
    setIsEditingId(thread.id);
    setEditingName(thread.name);
  };

  const handleSaveEdit = () => {
    if (isEditingId && editingName.trim()) {
      updateThreadName(isEditingId, editingName.trim());
    }
    setIsEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setIsEditingId(null);
    setEditingName('');
  };

  const handleDeleteThread = (threadId: string, threadName: string) => {
    if (confirm(`「${threadName}」を削除しますか？この操作は取り消せません。`)) {
      deleteThread(threadId);
      if (activeThread?.id === threadId) {
        onClose();
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sort threads by last accessed time (most recent first)
  const sortedThreads = [...threads].sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative m-4 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:m-0 sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            プロジェクト選択
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="閉じる"
          >
            <svg className="size-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Create New Thread Button */}
          <button
            onClick={handleCreateNewThread}
            disabled={isCreating}
            className="mb-4 w-full rounded-lg border-2 border-dashed border-blue-300 p-3 transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 sm:mb-6 sm:p-4"
          >
            <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="mr-2 size-5 sm:size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {isCreating ? '作成中...' : '新しいプロジェクトを作成'}
            </div>
          </button>

          {/* Thread List */}
          {sortedThreads.length === 0 ? (
            <div className="py-6 text-center text-gray-500 dark:text-gray-400 sm:py-8">
              プロジェクトがありません
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {sortedThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`rounded-lg border p-3 transition-colors sm:p-4 ${
                    activeThread?.id === thread.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      {isEditingId === thread.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 sm:text-base"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="rounded p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                            aria-label="保存"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="キャンセル"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSwitchThread(thread.id)}
                          className="w-full text-left"
                        >
                          <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 sm:text-base">
                            {thread.name}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            <span className="block sm:inline">{thread.files.length}個のファイル</span>
                            <span className="hidden sm:inline"> • 最終アクセス: {formatDate(thread.lastAccessedAt)}</span>
                            <span className="mt-1 block text-xs sm:hidden">{formatDate(thread.lastAccessedAt)}</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {isEditingId !== thread.id && (
                      <div className="ml-2 flex items-center space-x-1 sm:ml-3">
                        {activeThread?.id === thread.id && (
                          <span className="whitespace-nowrap rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                            開いています
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEdit(thread)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 sm:p-2"
                          aria-label="名前を編集"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteThread(thread.id, thread.name)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 sm:p-2"
                          aria-label="削除"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}