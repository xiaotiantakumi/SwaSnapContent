// Frontend types for Link Collector

export interface CollectedLink {
  url: string;
  source: string;
  depth: number;
  title?: string;
  selected: boolean;
}

export interface CollectionOptions {
  depth: number;
  delayMs: number;
  filters?: FilterOption[];
}

export interface FilterOption {
  domain?: string | string[];
  pathPrefix?: string | string[];
  regex?: string | string[];
  keywords?: string | string[];
}

export interface LinkCollectorState {
  // Input state
  targetUrl: string;
  selector: string;
  options: CollectionOptions;
  
  // Collection state
  isCollecting: boolean;
  collectionProgress: number;
  collectionErrors: string[];
  
  // Results state
  collectedUrls: CollectedLink[];
  selectedUrls: Set<string>;
  filteredUrls: CollectedLink[];
  
  // Filter state
  filterText: string;
  excludePatterns: string[];
}

export interface CollectionResult {
  success: boolean;
  data?: {
    allCollectedUrls: string[];
    linkRelationships: Array<{
      source: string;
      found: string;
    }>;
    stats: {
      totalPages: number;
      totalLinks: number;
      uniqueLinks: number;
      processingTime: number;
    };
  };
  error?: string;
  collectedAt?: string;
}

export interface NotebookLMFormat {
  separator: 'space' | 'newline';
  includeTitle: boolean;
  includeSource: boolean;
}