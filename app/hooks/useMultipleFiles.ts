import { useCallback, useMemo, useState } from 'react';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  lastModified?: Date;
}

export interface MultipleFilesHook {
  files: FileItem[];
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  moveFileUp: (id: string) => void;
  moveFileDown: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  clearAllFiles: () => void;
}

export function useMultipleFiles(): MultipleFilesHook {
  const [files, setFiles] = useState<FileItem[]>([]);

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

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

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

  const clearAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    moveFileUp,
    moveFileDown,
    reorderFiles,
    clearAllFiles,
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