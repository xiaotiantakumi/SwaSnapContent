import { useEffect, useRef } from 'react';
import { Tooltip } from '../ui/Tooltip';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  onError: (error: string) => void;
  isDragOver: boolean;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}

/**
 * 統一されたアイコンボタンスタイルのファイル追加ボタン
 * 他のツールボタンと同じデザインに統一
 */
export function DropZone({
  onFiles,
  onError,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      onFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  // プロジェクト作成後のファイルダイアログ自動表示
  useEffect(() => {
    const handleTriggerFileDialog = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    window.addEventListener('trigger-file-dialog', handleTriggerFileDialog);
    
    return () => {
      window.removeEventListener('trigger-file-dialog', handleTriggerFileDialog);
    };
  }, []);

  return (
    <div className="relative">
      {/* Hidden file input for clicking */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.markdown,.txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      {/* Unified icon button style with tooltip */}
      <Tooltip content="ファイルを選択またはドラッグ&ドロップ" position="bottom">
        <button
          type="button"
          className={`p-2 rounded-lg transition-all duration-200 text-white ${
            isDragOver 
              ? 'bg-blue-600 scale-110 shadow-lg'
              : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          aria-label="ファイル追加"
          data-testid="drop-zone-visual"
        >
          {isDragOver ? (
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      </Tooltip>
    </div>
  );
}