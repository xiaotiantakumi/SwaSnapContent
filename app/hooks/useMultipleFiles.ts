import { useCallback, useMemo, useState, useEffect } from 'react';
import { useFileStorage } from './useFileStorage';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  lastModified?: Date;
}

export interface MultipleFilesHook {
  files: FileItem[];
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string, skipStorageRemoval?: boolean) => void;
  moveFileUp: (id: string) => void;
  moveFileDown: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  clearAllFiles: (clearStorage?: boolean) => void;
  loadFilesFromStorage?: () => void;
}

export function useMultipleFiles(): MultipleFilesHook {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { 
    isFileStorage, 
    saveFilesToStorage, 
    loadFilesFromStorage, 
    removeFileFromStorage, 
    clearAllStoredFiles 
  } = useFileStorage();

  // 初期化時にlocalStorageから復元
  useEffect(() => {
    if (isFileStorage) {
      const savedFiles = loadFilesFromStorage();
      if (savedFiles.length > 0) {
        setFiles(savedFiles);
      }
    }
  }, [isFileStorage, loadFilesFromStorage]);

  // ファイルが変更されたらlocalStorageに保存
  useEffect(() => {
    if (isFileStorage && files.length > 0) {
      saveFilesToStorage(files);
    }
  }, [files, isFileStorage, saveFilesToStorage]);

  const addFiles = useCallback(async (newFiles: File[]) => {
    const fileItems: FileItem[] = [];

    for (const file of newFiles) {
      try {
        const content = await readFileContent(file);
        const fileItem: FileItem = {
          id: generateId(),
          name: file.name,
          content,
          lastModified: new Date(file.lastModified),
        };
        fileItems.push(fileItem);
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
        throw new Error(`Failed to read file ${file.name}`);
      }
    }

    setFiles((prev) => [...prev, ...fileItems]);
  }, []);

  const removeFile = useCallback((id: string, skipStorageRemoval = false) => {
    setFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== id);
      // localStorageからも削除（スキップフラグがない場合）
      if (isFileStorage && !skipStorageRemoval) {
        removeFileFromStorage(id);
      }
      return newFiles;
    });
  }, [isFileStorage, removeFileFromStorage]);

  const moveFileUp = useCallback((id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((file) => file.id === id);
      if (index <= 0) return prev;

      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [
        newFiles[index],
        newFiles[index - 1],
      ];
      return newFiles;
    });
  }, []);

  const moveFileDown = useCallback((id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((file) => file.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;

      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [
        newFiles[index + 1],
        newFiles[index],
      ];
      return newFiles;
    });
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      if (fromIndex === toIndex) return prev;

      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  }, []);

  const clearAllFiles = useCallback((clearStorage = false) => {
    setFiles([]);
    if (isFileStorage && clearStorage) {
      clearAllStoredFiles();
    }
  }, [isFileStorage, clearAllStoredFiles]);

  const loadStoredFiles = useCallback(() => {
    if (isFileStorage) {
      const savedFiles = loadFilesFromStorage();
      setFiles(savedFiles);
    }
  }, [isFileStorage, loadFilesFromStorage]);

  return {
    files,
    addFiles,
    removeFile,
    moveFileUp,
    moveFileDown,
    reorderFiles,
    clearAllFiles,
    loadFilesFromStorage: isFileStorage ? loadStoredFiles : undefined,
  };
}

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}