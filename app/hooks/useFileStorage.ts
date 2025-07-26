import { useCallback } from 'react';

import type { FileItem } from './useMultipleFiles';

const STORAGE_KEY = 'markdown-viewer-files';
const STORAGE_ORDER_KEY = 'markdown-viewer-files-order';

interface StoredFileData {
  id: string;
  name: string;
  content: string;
  lastModified: number;
  savedAt: number;
}

/**
 * ファイルのlocalStorage永続化フック
 * ファイル内容と順序を両方保存・復元
 */
export function useFileStorage() {
  const saveFilesToStorage = useCallback((files: FileItem[]) => {
    try {
      const storedData: StoredFileData[] = files.map(file => ({
        id: file.id,
        name: file.name,
        content: file.content,
        lastModified: file.lastModified?.getTime() || Date.now(),
        savedAt: Date.now(),
      }));

      const fileOrder = files.map(f => f.id);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(fileOrder));
      return true;
    } catch (error) {
      console.error('Failed to save files to localStorage:', error);
      return false;
    }
  }, []);

  const loadFilesFromStorage = useCallback((): FileItem[] => {
    try {
      const storedDataStr = localStorage.getItem(STORAGE_KEY);
      const orderStr = localStorage.getItem(STORAGE_ORDER_KEY);

      if (!storedDataStr) return [];

      const storedData: StoredFileData[] = JSON.parse(storedDataStr);
      const fileOrder: string[] = orderStr ? JSON.parse(orderStr) : [];

      // データをMapに変換
      const fileMap = new Map<string, StoredFileData>();
      storedData.forEach(file => fileMap.set(file.id, file));

      // 順序に従って復元、順序にないファイルは末尾に追加
      const orderedFiles: FileItem[] = [];
      const processedIds = new Set<string>();

      // 順序指定されたファイルを先に処理
      fileOrder.forEach(id => {
        const fileData = fileMap.get(id);
        if (fileData) {
          orderedFiles.push({
            id: fileData.id,
            name: fileData.name,
            content: fileData.content,
            lastModified: new Date(fileData.lastModified),
          });
          processedIds.add(id);
        }
      });

      // 順序にないファイルを末尾に追加
      storedData.forEach(fileData => {
        if (!processedIds.has(fileData.id)) {
          orderedFiles.push({
            id: fileData.id,
            name: fileData.name,
            content: fileData.content,
            lastModified: new Date(fileData.lastModified),
          });
        }
      });

      return orderedFiles;
    } catch (error) {
      console.error('Failed to load files from localStorage:', error);
      return [];
    }
  }, []);

  const removeFileFromStorage = useCallback((fileId: string) => {
    try {
      const storedDataStr = localStorage.getItem(STORAGE_KEY);
      const orderStr = localStorage.getItem(STORAGE_ORDER_KEY);

      if (storedDataStr) {
        const storedData: StoredFileData[] = JSON.parse(storedDataStr);
        const filteredData = storedData.filter(file => file.id !== fileId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));
      }

      if (orderStr) {
        const fileOrder: string[] = JSON.parse(orderStr);
        const filteredOrder = fileOrder.filter(id => id !== fileId);
        localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(filteredOrder));
      }

      return true;
    } catch (error) {
      console.error('Failed to remove file from localStorage:', error);
      return false;
    }
  }, []);

  const clearAllStoredFiles = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_ORDER_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear stored files:', error);
      return false;
    }
  }, []);

  const getSavedFilesCount = useCallback((): number => {
    try {
      const storedDataStr = localStorage.getItem(STORAGE_KEY);
      if (!storedDataStr) return 0;
      const storedData: StoredFileData[] = JSON.parse(storedDataStr);
      return storedData.length;
    } catch (error) {
      console.error('Failed to get saved files count:', error);
      return 0;
    }
  }, []);

  const isFileStorage = typeof window !== 'undefined' && 'localStorage' in window;

  return {
    isFileStorage,
    saveFilesToStorage,
    loadFilesFromStorage,
    removeFileFromStorage,
    clearAllStoredFiles,
    getSavedFilesCount,
  };
}