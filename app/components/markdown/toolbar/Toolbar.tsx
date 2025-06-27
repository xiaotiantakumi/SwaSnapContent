import { useState } from 'react';
import { useFileSystem } from '../../../hooks/useFileSystem';
import { useClipboard } from '../../../hooks/useClipboard';
import type { FileItem } from '../../../hooks/useMultipleFiles';

interface ToolbarProps {
  content: string;
  files: FileItem[];
  onFilesAdd: (files: File[]) => void;
  onClearAllFiles: () => void;
  onError: (error: string) => void;
  parsedContent?: string;
}

/**
 * Enhanced Toolbar component with file operations
 * Provides multiple file operations and clipboard functionality
 */
export function Toolbar({
  content,
  files,
  onFilesAdd,
  onClearAllFiles,
  onError,
  parsedContent,
}: ToolbarProps) {
  const { openFiles, isFileSystemSupported } = useFileSystem();
  const { pasteFromClipboard, supportsClipboard } = useClipboard();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenFiles = async () => {
    try {
      setIsLoading(true);
      const selectedFiles = await openFiles();
      if (selectedFiles.length > 0) {
        onFilesAdd(selectedFiles);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ファイルを開けませんでした';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const pastedContent = await pasteFromClipboard();
      if (pastedContent) {
        // Create a temporary file from clipboard content
        const clipboardFile = new File([pastedContent], 'クリップボード.md', {
          type: 'text/markdown',
          lastModified: Date.now(),
        });
        onFilesAdd([clipboardFile]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'クリップボードから貼り付けできませんでした';
      onError(errorMessage);
    }
  };

  const handleClearAll = () => {
    if (files.length > 0) {
      if (confirm(`${files.length}個のファイルを全て削除しますか？`)) {
        onClearAllFiles();
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = parsedContent || content;
      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        // You could add success feedback here
      }
    } catch (err) {
      onError('クリップボードにコピーできませんでした');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Markdownビューア
      </div>

      <div className="flex items-center space-x-3">
        {/* File Statistics */}
        {files.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {files.length}個のファイルを読み込み済み
          </div>
        )}

        {/* Open Files Button */}
        <button
          type="button"
          onClick={handleOpenFiles}
          disabled={isLoading}
          className={`rounded px-3 py-1 text-sm text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          }`}
          title={`複数のMarkdownファイルを選択 ${isFileSystemSupported ? '(モダンAPI)' : '(レガシーモード)'}`}
        >
          {isLoading ? '読み込み中...' : 'ファイル選択'}
        </button>

        {/* Paste Button */}
        {supportsClipboard && (
          <button
            type="button"
            onClick={handlePaste}
            className="rounded px-3 py-1 text-sm text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
            title="クリップボードからMarkdownを貼り付け"
          >
            貼り付け
          </button>
        )}

        {/* Copy Button */}
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded px-3 py-1 text-sm text-white bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors"
          title="コンテンツをクリップボードにコピー"
        >
          コピー
        </button>

        {/* Clear All Button */}
        {files.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
            title="全てのファイルを削除"
            data-testid="clear-all"
          >
            全て削除
          </button>
        )}
      </div>
    </div>
  );
}