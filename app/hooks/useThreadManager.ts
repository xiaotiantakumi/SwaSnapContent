import { useState, useCallback, useEffect } from 'react';
import type { 
  Thread, 
  MarkdownFile, 
  AppStorage,
} from '../types/thread';
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  LEGACY_STORAGE_KEY,
  LEGACY_ORDER_KEY,
} from '../types/thread';

// UUID v4 generator for unique IDs
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate file ID
function generateFileId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Read file content
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export interface ThreadManagerHook {
  // State
  threads: Thread[];
  activeThread: Thread | null;
  isLoading: boolean;
  
  // Thread operations
  createThread: (name?: string) => Promise<string>;
  switchThread: (threadId: string) => void;
  updateThreadName: (threadId: string, newName: string) => void;
  deleteThread: (threadId: string) => void;
  
  // File operations for active thread
  addFilesToActiveThread: (files: File[]) => Promise<void>;
  updateFileInActiveThread: (fileId: string, newContent: string) => void;
  removeFileFromActiveThread: (fileId: string) => void;
  moveFileUpInActiveThread: (fileId: string) => void;
  moveFileDownInActiveThread: (fileId: string) => void;
  reorderFilesInActiveThread: (fromIndex: number, toIndex: number) => void;
  
  // Utility
  getThreadById: (threadId: string) => Thread | undefined;
}

export function useThreadManager(): ThreadManagerHook {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get active thread
  const activeThread = threads.find(t => t.id === activeThreadId) || null;

  // Load storage data
  const loadFromStorage = useCallback((): AppStorage | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data) as AppStorage;
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch, might need migration');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to load from storage:', error);
      return null;
    }
  }, []);

  // Save to storage
  const saveToStorage = useCallback((data: AppStorage) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('ストレージの容量が不足しています。不要なスレッドを削除してください。');
      }
      throw new Error('データの保存に失敗しました。');
    }
  }, []);

  // Migrate legacy data
  const migrateLegacyData = useCallback((): Thread | null => {
    try {
      const legacyFiles = localStorage.getItem(LEGACY_STORAGE_KEY);
      const legacyOrder = localStorage.getItem(LEGACY_ORDER_KEY);
      
      if (!legacyFiles) return null;

      const files = JSON.parse(legacyFiles);
      const order = legacyOrder ? JSON.parse(legacyOrder) : [];
      
      // Convert legacy files to new format
      const markdownFiles: MarkdownFile[] = files.map((file: any) => ({
        id: generateFileId(),
        name: file.name,
        content: file.content,
        lastModified: file.lastModified || Date.now(),
      }));

      // Apply order if available
      if (order.length > 0) {
        const orderedFiles: MarkdownFile[] = [];
        for (const fileName of order) {
          const file = markdownFiles.find(f => f.name === fileName);
          if (file) orderedFiles.push(file);
        }
        // Add any files not in order at the end
        for (const file of markdownFiles) {
          if (!orderedFiles.find(f => f.id === file.id)) {
            orderedFiles.push(file);
          }
        }
        markdownFiles.splice(0, markdownFiles.length, ...orderedFiles);
      }

      const migratedThread: Thread = {
        id: generateId(),
        name: markdownFiles.length > 0 ? 
          markdownFiles[0].name.replace(/\.[^/.]+$/, '') : // Remove extension
          'マイグレーションされたプロジェクト',
        files: markdownFiles,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      // Clean up legacy storage
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_ORDER_KEY);

      return migratedThread;
    } catch (error) {
      console.error('Migration failed:', error);
      return null;
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      let appData = loadFromStorage();
      
      // Check for legacy data migration
      if (!appData) {
        const migratedThread = migrateLegacyData();
        if (migratedThread) {
          appData = {
            version: STORAGE_VERSION,
            activeThreadId: migratedThread.id,
            threads: [migratedThread],
          };
          saveToStorage(appData);
        } else {
          // No data at all, initialize empty
          appData = {
            version: STORAGE_VERSION,
            activeThreadId: null,
            threads: [],
          };
        }
      }

      setThreads(appData.threads);
      setActiveThreadId(appData.activeThreadId);
      setIsLoading(false);
    };

    initialize();
  }, [loadFromStorage, migrateLegacyData, saveToStorage]);

  // Save changes to storage whenever threads or activeThreadId changes
  useEffect(() => {
    if (!isLoading) {
      const appData: AppStorage = {
        version: STORAGE_VERSION,
        activeThreadId,
        threads,
      };
      saveToStorage(appData);
    }
  }, [threads, activeThreadId, isLoading, saveToStorage]);

  const createThread = useCallback(async (name?: string): Promise<string> => {
    const newThread: Thread = {
      id: generateId(),
      name: name || '新しいプロジェクト',
      files: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    setThreads(prev => [...prev, newThread]);
    setActiveThreadId(newThread.id);
    
    return newThread.id;
  }, []);

  const switchThread = useCallback((threadId: string) => {
    setThreads(prev => prev.map(thread => 
      thread.id === threadId 
        ? { ...thread, lastAccessedAt: Date.now() }
        : thread
    ));
    setActiveThreadId(threadId);
  }, []);

  const updateThreadName = useCallback((threadId: string, newName: string) => {
    setThreads(prev => prev.map(thread =>
      thread.id === threadId
        ? { ...thread, name: newName }
        : thread
    ));
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  }, [activeThreadId]);

  const addFilesToActiveThread = useCallback(async (files: File[]) => {
    if (!activeThreadId) return;

    const markdownFiles: MarkdownFile[] = [];
    
    for (const file of files) {
      try {
        const content = await readFileContent(file);
        const markdownFile: MarkdownFile = {
          id: generateFileId(),
          name: file.name,
          content,
          lastModified: file.lastModified,
        };
        markdownFiles.push(markdownFile);
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
        throw new Error(`Failed to read file ${file.name}`);
      }
    }

    setThreads(prev => prev.map(thread => {
      if (thread.id === activeThreadId) {
        const updatedThread = {
          ...thread,
          files: [...thread.files, ...markdownFiles],
          lastAccessedAt: Date.now(),
        };
        
        // Auto-rename thread if it's a new thread with default name
        if (thread.name === '新しいプロジェクト' && markdownFiles.length > 0) {
          updatedThread.name = markdownFiles[0].name.replace(/\.[^/.]+$/, '');
        }
        
        return updatedThread;
      }
      return thread;
    }));
  }, [activeThreadId]);

  const updateFileInActiveThread = useCallback((fileId: string, newContent: string) => {
    if (!activeThreadId) return;

    setThreads(prev => prev.map(thread =>
      thread.id === activeThreadId
        ? {
            ...thread,
            files: thread.files.map(file =>
              file.id === fileId
                ? { ...file, content: newContent, lastModified: Date.now() }
                : file
            ),
            lastAccessedAt: Date.now(),
          }
        : thread
    ));
  }, [activeThreadId]);

  const removeFileFromActiveThread = useCallback((fileId: string) => {
    if (!activeThreadId) return;

    setThreads(prev => prev.map(thread =>
      thread.id === activeThreadId
        ? {
            ...thread,
            files: thread.files.filter(file => file.id !== fileId),
            lastAccessedAt: Date.now(),
          }
        : thread
    ));
  }, [activeThreadId]);

  const moveFileUpInActiveThread = useCallback((fileId: string) => {
    if (!activeThreadId) return;

    setThreads(prev => prev.map(thread => {
      if (thread.id === activeThreadId) {
        const files = [...thread.files];
        const index = files.findIndex(file => file.id === fileId);
        if (index <= 0) return thread;

        [files[index - 1], files[index]] = [files[index], files[index - 1]];
        
        return {
          ...thread,
          files,
          lastAccessedAt: Date.now(),
        };
      }
      return thread;
    }));
  }, [activeThreadId]);

  const moveFileDownInActiveThread = useCallback((fileId: string) => {
    if (!activeThreadId) return;

    setThreads(prev => prev.map(thread => {
      if (thread.id === activeThreadId) {
        const files = [...thread.files];
        const index = files.findIndex(file => file.id === fileId);
        if (index === -1 || index >= files.length - 1) return thread;

        [files[index], files[index + 1]] = [files[index + 1], files[index]];
        
        return {
          ...thread,
          files,
          lastAccessedAt: Date.now(),
        };
      }
      return thread;
    }));
  }, [activeThreadId]);

  const reorderFilesInActiveThread = useCallback((fromIndex: number, toIndex: number) => {
    if (!activeThreadId) return;

    setThreads(prev => prev.map(thread => {
      if (thread.id === activeThreadId) {
        const files = [...thread.files];
        if (fromIndex === toIndex) return thread;

        const [movedFile] = files.splice(fromIndex, 1);
        files.splice(toIndex, 0, movedFile);
        
        return {
          ...thread,
          files,
          lastAccessedAt: Date.now(),
        };
      }
      return thread;
    }));
  }, [activeThreadId]);

  const getThreadById = useCallback((threadId: string): Thread | undefined => {
    return threads.find(thread => thread.id === threadId);
  }, [threads]);

  return {
    threads,
    activeThread,
    isLoading,
    createThread,
    switchThread,
    updateThreadName,
    deleteThread,
    addFilesToActiveThread,
    updateFileInActiveThread,
    removeFileFromActiveThread,
    moveFileUpInActiveThread,
    moveFileDownInActiveThread,
    reorderFilesInActiveThread,
    getThreadById,
  };
}