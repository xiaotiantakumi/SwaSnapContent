// Link collection related types and interfaces

export interface CollectedLink {
  url: string;
  source: string;
  depth: number;
  title?: string;
}

export interface CollectionOptions {
  depth?: number;
  delayMs?: number;
  filters?: Filter[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  skipQueryUrls?: boolean;
  skipHashUrls?: boolean;
}

export interface Filter {
  domain?: string | string[];
  pathPrefix?: string | string[];
  regex?: string | string[];
  keywords?: string | string[];
}

export interface LinkRelationship {
  source: string;
  found: string;
}

export interface CollectionStats {
  startTime: string;
  endTime: string;
  durationMs: number;
  totalUrlsScanned: number;
  totalUrlsCollected: number;
  maxDepthReached: number;
}

export interface LibraryCollectionResult {
  initialUrl: string;
  depth: number;
  allCollectedUrls: string[];
  linkRelationships: LinkRelationship[];
  errors: Array<{
    url: string;
    errorType: string;
    message: string;
  }>;
  stats: CollectionStats;
}

export interface CollectionResult {
  success: boolean;
  data?: {
    allCollectedUrls: string[];
    linkRelationships: LinkRelationship[];
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

export interface CollectionRequest {
  url: string;
  selector?: string;
  options?: CollectionOptions;
}