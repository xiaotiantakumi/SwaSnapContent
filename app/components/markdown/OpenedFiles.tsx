import type { MarkdownFile } from '../../types/thread';

interface OpenedFilesProps {
  files: MarkdownFile[];
  onRemoveFile: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function OpenedFiles({
  files,
  onRemoveFile,
  onMoveUp,
  onMoveDown,
}: OpenedFilesProps) {
  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="text-2xl mb-2">📁</div>
        <div className="text-sm">開いているファイルがありません</div>
        <div className="text-xs mt-1">
          ファイルを開くか、ドラッグ&ドロップで始めましょう
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="px-4 py-2">
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          開いているファイル ({files.length}個)
        </h3>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="flex flex-col space-y-1">
                <button
                  type="button"
                  onClick={() => onMoveUp(file.id)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-500 dark:hover:text-gray-300"
                  aria-label="上に移動"
                  data-testid={`move-up-${index}`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(file.id)}
                  disabled={index === files.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-500 dark:hover:text-gray-300"
                  aria-label="下に移動"
                  data-testid={`move-down-${index}`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(file.lastModified).toLocaleDateString()} •{' '}
                  {Math.round(file.content.length / 1024)}KB
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
              aria-label={`${file.name}を削除`}
              data-testid={`remove-file-${index}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}