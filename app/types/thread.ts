export interface MarkdownFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

export interface Thread {
  id: string;
  name: string;
  files: MarkdownFile[];
  createdAt: number;
  lastAccessedAt: number;
}

export interface AppStorage {
  version: number;
  activeThreadId: string | null;
  threads: Thread[];
}

// Storage constants
export const STORAGE_KEY = 'markdown-viewer-app-storage';
export const STORAGE_VERSION = 1;

// Legacy storage key for migration
export const LEGACY_STORAGE_KEY = 'markdown-viewer-files';
export const LEGACY_ORDER_KEY = 'markdown-viewer-files-order';