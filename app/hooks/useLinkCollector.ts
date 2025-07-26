import { useState, useCallback } from 'react';
import { CollectedLink, CollectionOptions, NotebookLMFormat } from '../types/link-collector';
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

  const collectLinks = useCallback(async (
    url: string, 
    selector: string, 
    options: CollectionOptions
  ) => {
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
      const urls: CollectedLink[] = result.data.allCollectedUrls.map((linkUrl) => {
        const relationship = result.data!.linkRelationships.find(rel => rel.found === linkUrl);
        return {
          url: linkUrl,
          source: relationship?.source || url,
          depth: 0, // depth information is not available from linkRelationships
          selected: false,
        };
      });
      
      setCollectedUrls(urls);
      setSelectedUrls(new Set());
      setStats(result.data.stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setError(errorMessage);
      console.error('Link collection error:', err);
    } finally {
      setIsCollecting(false);
    }
  }, []);

  const toggleUrlSelection = useCallback((url: string) => {
    setSelectedUrls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedUrls(new Set(collectedUrls.map(item => item.url)));
    } else {
      setSelectedUrls(new Set());
    }
  }, [collectedUrls]);

  const copySelectedUrls = useCallback(async (format: NotebookLMFormat) => {
    const selectedUrlsList = Array.from(selectedUrls);
    
    if (selectedUrlsList.length === 0) {
      throw new Error('選択されたURLがありません');
    }

    let textToCopy: string;
    
    if (format.includeTitle || format.includeSource) {
      // Include additional information
      const urlsWithInfo = selectedUrlsList.map(url => {
        const item = collectedUrls.find(item => item.url === url);
        const parts = [url];
        
        if (format.includeTitle && item?.title) {
          parts.push(`(${item.title})`);
        }
        
        if (format.includeSource && item?.source && item.source !== url) {
          parts.push(`[from: ${item.source}]`);
        }
        
        return parts.join(' ');
      });
      
      textToCopy = format.separator === 'space' 
        ? urlsWithInfo.join(' ') 
        : urlsWithInfo.join('\n');
    } else {
      // URLs only
      textToCopy = format.separator === 'space' 
        ? selectedUrlsList.join(' ') 
        : selectedUrlsList.join('\n');
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
  }, [selectedUrls, collectedUrls]);

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