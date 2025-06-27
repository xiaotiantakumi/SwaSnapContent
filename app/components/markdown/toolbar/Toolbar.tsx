import { useClipboard } from '../../../hooks/useClipboard';
import { DropZone } from '../DropZone';
import { MobileMenu } from './MobileMenu';
import { Tooltip } from '../../ui/Tooltip';
import type { MarkdownFile } from '../../../types/thread';

interface ToolbarProps {
  content: string;
  files: MarkdownFile[];
  onFilesAdd: (files: File[]) => void;
  onClearAllFiles: () => void;
  onError: (error: string) => void;
  parsedContent?: string;
  // DropZone props
  isDragOver: boolean;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}

/**
 * Enhanced Toolbar component with icon-based operations
 * Desktop: Icon buttons with tooltips, Mobile: Hamburger menu
 * localStorage integration for file persistence
 */
export function Toolbar({
  content,
  files,
  onFilesAdd,
  onClearAllFiles,
  onError,
  parsedContent,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: ToolbarProps) {
  const { pasteFromClipboard, supportsClipboard } = useClipboard();

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
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'クリップボードから貼り付けできませんでした';
      onError(errorMessage);
    }
  };

  const handleClearAll = () => {
    if (files.length > 0) {
      const message = `${files.length}個のファイルを全て削除しますか？`;
      if (confirm(message)) {
        onClearAllFiles();
      }
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Markdownビューア
      </div>

      <div className="flex items-center space-x-3">
        {/* Visual Drop Zone */}
        <DropZone
          onFiles={onFilesAdd}
          onError={onError}
          isDragOver={isDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
        
        {/* File Statistics */}
        {files.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {files.length}個のファイルを読み込み済み
          </div>
        )}

        {/* Desktop Icon Buttons */}
        <div className="hidden md:flex items-center space-x-2">
          {/* Paste Button */}
          {supportsClipboard && (
            <Tooltip content="クリップボードからMarkdownを貼り付け" position="bottom">
              <button
                type="button"
                onClick={handlePaste}
                className="p-2 rounded-lg bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors text-white"
                aria-label="クリップボード貼り付け"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </Tooltip>
          )}

          {/* Clear All Button */}
          {files.length > 0 && (
            <Tooltip content="全てのファイルを削除" position="bottom">
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors text-white"
                aria-label="全て削除"
                data-testid="clear-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <MobileMenu
          files={files}
          onFilesAdd={onFilesAdd}
          onClearAllFiles={onClearAllFiles}
          onError={onError}
          parsedContent={parsedContent}
          content={content}
        />
      </div>
    </div>
  );
}