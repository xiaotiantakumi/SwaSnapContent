'use client';

import { useState } from 'react';
import Header from '../../components/header';
import { ThreadProvider } from '../../contexts/ThreadContext';
import { MarkdownPreview } from '../../components/markdown/MarkdownPreview';
import { OpenedFiles } from '../../components/markdown/OpenedFiles';
import { ScrollToTopButton } from '../../components/markdown/ScrollToTopButton';
import { Toolbar } from '../../components/markdown/toolbar/Toolbar';
import { ThreadHeader } from '../../components/thread/ThreadHeader';
import { useCombinedContent } from '../../hooks/useCombinedContent';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useMarkdownParser } from '../../hooks/useMarkdownParser';
import { useThread } from '../../contexts/ThreadContext';
import { DEFAULT_MARKDOWN_CONTENT, NEW_PROJECT_WELCOME_CONTENT } from '../../lib/markdown-constants';

function MarkdownViewerContent() {
  const [error, setError] = useState<string | null>(null);
  const { 
    activeThread,
    addFilesToActiveThread,
    removeFileFromActiveThread,
    moveFileUpInActiveThread,
    moveFileDownInActiveThread,
  } = useThread();

  // Use files from active thread
  const files = activeThread?.files || [];

  // Combined content from all files
  const { combinedContent, stats } = useCombinedContent(files);

  // Use combined content or appropriate welcome content if no files
  const displayContent = files.length > 0 
    ? combinedContent 
    : (activeThread && activeThread.name !== 'Markdownビューア' 
        ? NEW_PROJECT_WELCOME_CONTENT 
        : DEFAULT_MARKDOWN_CONTENT);
  const { parsedContent, isDebouncing } = useMarkdownParser(displayContent);

  // Drag and drop functionality
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
    onFiles: addFilesToActiveThread,
    onError: setError,
  });

  const handleClearAllFiles = () => {
    if (activeThread) {
      // Remove all files from active thread
      activeThread.files.forEach(file => {
        removeFileFromActiveThread(file.id);
      });
    }
  };

  const clearError = () => setError(null);

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header with back button */}
      <div className="p-4">
        <Header 
          showBackButton={true}
        />
      </div>
      
      {/* Thread Header */}
      <ThreadHeader />
      
      {/* Enhanced Toolbar */}
      <Toolbar
        content={displayContent}
        files={files}
        onFilesAdd={addFilesToActiveThread}
        onClearAllFiles={handleClearAllFiles}
        onError={setError}
        parsedContent={parsedContent}
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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

      {/* Main Content - Single Pane Layout with Enhanced Drop Zone */}
      <div
        className={`flex flex-1 overflow-hidden relative border-2 border-dashed transition-all duration-200 ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-inner' 
            : 'border-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="drop-zone"
      >
        {/* Enhanced Drag Overlay with Animation */}
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-100 bg-opacity-90 dark:bg-blue-900 dark:bg-opacity-90 backdrop-blur-sm">
            <div className="rounded-lg bg-white p-8 shadow-2xl dark:bg-gray-800 border-2 border-blue-500 transform scale-105 transition-transform">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">📅</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  Markdownファイルをここにドロップ
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  .md、.markdown、.txtファイルに対応
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                  複数ファイル同時アップロード可能
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
              onRemoveFile={removeFileFromActiveThread}
              onMoveUp={moveFileUpInActiveThread}
              onMoveDown={moveFileDownInActiveThread}
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
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton threshold={300} />
    </main>
  );
}

export default function MarkdownViewerPage() {
  return (
    <ThreadProvider>
      <MarkdownViewerContent />
    </ThreadProvider>
  );
}