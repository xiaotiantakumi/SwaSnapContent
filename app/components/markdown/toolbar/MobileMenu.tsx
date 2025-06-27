import { useState } from 'react';
import { useFileSystem } from '../../../hooks/useFileSystem';
import { useClipboard } from '../../../hooks/useClipboard';
import type { FileItem } from '../../../hooks/useMultipleFiles';

interface MobileMenuProps {
  files: FileItem[];
  onFilesAdd: (files: File[]) => void;
  onClearAllFiles: () => void;
  onError: (error: string) => void;
  parsedContent?: string;
  content: string;
}

/**
 * モバイル用ハンバーガーメニュー
 * アイコン化されたツール群を格納
 */
export function MobileMenu({
  files,
  onFilesAdd,
  onClearAllFiles,
  onError,
  parsedContent,
  content,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { openFiles } = useFileSystem();
  const { pasteFromClipboard, supportsClipboard } = useClipboard();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleOpenFiles = async () => {
    try {
      setIsLoading(true);
      const selectedFiles = await openFiles();
      if (selectedFiles.length > 0) {
        onFilesAdd(selectedFiles);
      }
      closeMenu();
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
        const clipboardFile = new File([pastedContent], 'クリップボード.md', {
          type: 'text/markdown',
          lastModified: Date.now(),
        });
        onFilesAdd([clipboardFile]);
      }
      closeMenu();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'クリップボードから貼り付けできませんでした';
      onError(errorMessage);
    }
  };


  const handleClearAll = () => {
    if (files.length > 0) {
      if (confirm(`${files.length}個のファイルを全て削除しますか？`)) {
        onClearAllFiles();
        closeMenu();
      }
    }
  };

  return (
    <div className="relative md:hidden">
      {/* ハンバーガーボタン */}
      <button
        type="button"
        onClick={toggleMenu}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* メニュー内容 */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
          {/* ファイル追加 */}
          <button
            type="button"
            onClick={handleOpenFiles}
            disabled={isLoading}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">
              {isLoading ? '読み込み中...' : 'ファイル追加'}
            </span>
          </button>

          {/* 貼り付け */}
          {supportsClipboard && (
            <button
              type="button"
              onClick={handlePaste}
              className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-900 dark:text-gray-100">クリップボード貼り付け</span>
            </button>
          )}


          {/* 全て削除 */}
          {files.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full flex items-center px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-red-600 dark:text-red-400">全て削除</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}