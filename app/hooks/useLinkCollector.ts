import { useState, useCallback } from 'react';

import {
  type CollectedLink,
  type CollectionOptions,
  type NotebookLMFormat,
} from '../types/link-collector';
import { collectLinksAPI } from '../utils/link-collector-api';

export function useLinkCollector() {
  const [collectedUrls, setCollectedUrls] = useState<CollectedLink[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalPages: number;
    totalLinks: number;
    uniqueLinks: number;
    processingTime: number;
  } | null>(null);

  const collectLinks = useCallback(
    async (url: string, selector: string, options: CollectionOptions) => {
      setIsCollecting(true);
      setError(null);
      setStats(null);

      try {
        const result = await collectLinksAPI(url, selector, options);

        if (!result.success) {
          throw new Error(result.error || 'Collection failed');
        }

        if (!result.data) {
          throw new Error('No data received from API');
        }

        // Convert API response to CollectedLink format
        const urls: CollectedLink[] = result.data.allCollectedUrls.map(
          (linkUrl) => {
            const relationship = result.data?.linkRelationships.find(
              (rel) => rel.found === linkUrl
            );
            return {
              url: linkUrl,
              source: relationship?.source || url,
              depth: 0, // depth information is not available from linkRelationships
              selected: false,
            };
          }
        );

        setCollectedUrls(urls);
        setSelectedUrls(new Set());
        setStats(result.data.stats);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'エラーが発生しました';
        setError(errorMessage);
        console.error('Link collection error:', err);
      } finally {
        setIsCollecting(false);
      }
    },
    []
  );

  const toggleUrlSelection = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedUrls(new Set(collectedUrls.map((item) => item.url)));
      } else {
        setSelectedUrls(new Set());
      }
    },
    [collectedUrls]
  );

  const copySelectedUrls = useCallback(
    async (format: NotebookLMFormat, filteredUrls?: CollectedLink[]) => {
      // フィルタ済みURLが提供されている場合、フィルタ済みURLのうち選択されているもののみを使用
      const urlsToCopy = filteredUrls
        ? filteredUrls.filter((item) => selectedUrls.has(item.url))
        : Array.from(selectedUrls)
            .map((url) => collectedUrls.find((item) => item.url === url))
            .filter((item): item is CollectedLink => item !== undefined);

      if (urlsToCopy.length === 0) {
        throw new Error('選択されたURLがありません');
      }

      let textToCopy: string;

      if (format.includeTitle || format.includeSource) {
        // Include additional information
        const urlsWithInfo = urlsToCopy.map((item) => {
          const parts = [item.url];

          if (format.includeTitle && item.title) {
            parts.push(`(${item.title})`);
          }

          if (format.includeSource && item.source && item.source !== item.url) {
            parts.push(`[from: ${item.source}]`);
          }

          return parts.join(' ');
        });

        textToCopy =
          format.separator === 'space'
            ? urlsWithInfo.join(' ')
            : urlsWithInfo.join('\n');
      } else {
        // URLs only
        const urlStrings = urlsToCopy.map((item) => item.url);
        textToCopy =
          format.separator === 'space'
            ? urlStrings.join(' ')
            : urlStrings.join('\n');
      }

      try {
        await navigator.clipboard.writeText(textToCopy);
        // Could add toast notification here
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    },
    [selectedUrls, collectedUrls]
  );

  const exportResults = useCallback(() => {
    const dataToExport = {
      collectedAt: new Date().toISOString(),
      stats,
      urls: collectedUrls,
      selectedUrls: Array.from(selectedUrls),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-collection-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [collectedUrls, selectedUrls, stats]);

  const clearResults = useCallback(() => {
    setCollectedUrls([]);
    setSelectedUrls(new Set());
    setError(null);
    setStats(null);
  }, []);

  return {
    // State
    collectedUrls,
    selectedUrls,
    isCollecting,
    error,
    stats,

    // Actions
    collectLinks,
    toggleUrlSelection,
    selectAll,
    copySelectedUrls,
    exportResults,
    clearResults,
  };
}
