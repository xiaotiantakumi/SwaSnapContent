'use client';

import { useState } from 'react';
import Header from '../components/header';
import { MarkdownPreview } from '../components/markdown/MarkdownPreview';
import { OpenedFiles } from '../components/markdown/OpenedFiles';
import { Toolbar } from '../components/markdown/toolbar/Toolbar';
import { useCombinedContent } from '../hooks/useCombinedContent';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useMarkdownParser } from '../hooks/useMarkdownParser';
import { useMultipleFiles } from '../hooks/useMultipleFiles';
import { DEFAULT_MARKDOWN_CONTENT } from '../lib/markdown-constants';

export default function MarkdownViewerPage() {
  const [error, setError] = useState<string | null>(null);

  // Multiple files management
  const {
    files,
    addFiles,
    removeFile,
    moveFileUp,
    moveFileDown,
    clearAllFiles,
  } = useMultipleFiles();

  // Combined content from all files
  const { combinedContent, stats } = useCombinedContent(files);

  // Use combined content or default if no files
  const displayContent = files.length > 0 ? combinedContent : DEFAULT_MARKDOWN_CONTENT;
  const { parsedContent, isDebouncing } = useMarkdownParser(displayContent);

  // Drag and drop functionality
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
    onFiles: addFiles,
    onError: setError,
  });

  const clearError = () => setError(null);

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4">
        <Header 
          showBackButton={true}
        />
      </div>
      
      {/* Enhanced Toolbar */}
      <Toolbar
        content={displayContent}
        files={files}
        onFilesAdd={addFiles}
        onClearAllFiles={clearAllFiles}
        onError={setError}
        parsedContent={parsedContent}
      />

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            aria-label="エラーを消去"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content - Single Pane Layout with Drag & Drop */}
      <div
        className={`flex flex-1 overflow-hidden relative ${
          isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="drop-zone"
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-100 bg-opacity-75 dark:bg-blue-900 dark:bg-opacity-75">
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
              <div className="text-center">
                <div className="text-4xl mb-4">📄</div>
                <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Markdownファイルをここにドロップ
                </div>
                <div className="text-sm text-gray-500 mt-2 dark:text-gray-400">
                  .md、.markdown、.txtファイルに対応（複数ファイル可）
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Preview Pane */}
        <div className="flex w-full flex-col">
          {/* Opened Files List (shown when files are loaded) */}
          {files.length > 0 && (
            <OpenedFiles
              files={files}
              onRemoveFile={removeFile}
              onMoveUp={moveFileUp}
              onMoveDown={moveFileDown}
            />
          )}

          {/* Content Header */}
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {files.length > 0 ? '結合プレビュー' : 'Markdownビューア'}
                </h2>
                {isDebouncing && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    更新中...
                  </span>
                )}
              </div>
              {files.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.files}個のファイル • {stats.words}語 • {stats.characters}文字
                </div>
              )}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-white p-4 dark:bg-gray-900">
            <MarkdownPreview content={parsedContent} />
          </div>
        </div>
      </div>
    </main>
  );
}