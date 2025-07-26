import { useCallback } from 'react';
import { MAX_FILE_SIZE, SUPPORTED_FILE_EXTENSIONS } from '../lib/markdown-constants';

interface FileSystemHookReturn {
  openFile: () => Promise<string | null>;
  openFiles: () => Promise<File[]>;
  saveFile: (content: string, filename?: string) => Promise<void>;
  isFileSystemSupported: boolean;
}

/**
 * Custom hook for file system operations
 * Uses modern File System Access API with fallback for older browsers
 */
export function useFileSystem(): FileSystemHookReturn {
  // Check if File System Access API is supported
  const isFileSystemSupported = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

  const openFile = useCallback(async (): Promise<string | null> => {
    try {
      if (isFileSystemSupported) {
        // Modern File System Access API
        const [fileHandle] = await (window as unknown as { showOpenFilePicker: (options: { types: { description: string; accept: Record<string, string[]> }[], multiple?: boolean }) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
          types: [
            {
              description: 'Markdown files',
              accept: {
                'text/markdown': [...SUPPORTED_FILE_EXTENSIONS],
                'text/plain': ['.txt'],
              },
            },
          ],
          multiple: false,
        });

        const file = await fileHandle.getFile();

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          );
        }

        return await file.text();
      } else {
        // Fallback for older browsers
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = SUPPORTED_FILE_EXTENSIONS.join(',');

          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              resolve(null);
              return;
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
              reject(
                new Error(
                  `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                ),
              );
              return;
            }

            try {
              const text = await file.text();
              resolve(text);
            } catch (error) {
              reject(error);
            }
          };

          input.oncancel = () => resolve(null);
          input.click();
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the operation
        return null;
      }
      throw error;
    }
  }, [isFileSystemSupported]);

  const saveFile = useCallback(
    async (content: string, filename = 'document.md'): Promise<void> => {
      try {
        if (isFileSystemSupported) {
          // Modern File System Access API
          const fileHandle = await (window as unknown as { showSaveFilePicker: (options: { types: { description: string; accept: Record<string, string[]> }[], suggestedName?: string }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
            types: [
              {
                description: 'Markdown files',
                accept: {
                  'text/markdown': ['.md'],
                  'text/plain': ['.txt'],
                },
              },
            ],
            suggestedName: filename,
          });

          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
        } else {
          // Fallback for older browsers
          const blob = new Blob([content], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          URL.revokeObjectURL(url);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User cancelled the operation
          return;
        }
        throw error;
      }
    },
    [isFileSystemSupported],
  );

  const openFiles = useCallback(async (): Promise<File[]> => {
    try {
      if (isFileSystemSupported) {
        // Modern File System Access API
        const fileHandles = await (window as unknown as { showOpenFilePicker: (options: { types: { description: string; accept: Record<string, string[]> }[], multiple?: boolean }) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
          types: [
            {
              description: 'Markdown files',
              accept: {
                'text/markdown': [...SUPPORTED_FILE_EXTENSIONS],
                'text/plain': ['.txt'],
              },
            },
          ],
          multiple: true,
        });

        const files: File[] = [];
        for (const fileHandle of fileHandles) {
          const file = await fileHandle.getFile();

          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(
              `File "${file.name}" size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            );
          }

          files.push(file);
        }

        return files;
      } else {
        // Fallback for older browsers
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = SUPPORTED_FILE_EXTENSIONS.join(',');
          input.multiple = true;

          input.onchange = async (event) => {
            const fileList = (event.target as HTMLInputElement).files;
            if (!fileList || fileList.length === 0) {
              resolve([]);
              return;
            }

            const files: File[] = [];
            for (let i = 0; i < fileList.length; i++) {
              const file = fileList[i];

              // Validate file size
              if (file.size > MAX_FILE_SIZE) {
                reject(
                  new Error(
                    `File "${file.name}" size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                  ),
                );
                return;
              }

              files.push(file);
            }

            resolve(files);
          };

          input.oncancel = () => resolve([]);
          input.click();
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the operation
        return [];
      }
      throw error;
    }
  }, [isFileSystemSupported]);

  return {
    openFile,
    openFiles,
    saveFile,
    isFileSystemSupported,
  };
}