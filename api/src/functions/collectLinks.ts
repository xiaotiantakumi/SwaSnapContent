import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { collectLinks } from 'web-link-collector';
import { 
  CollectionRequest, 
  CollectionResult, 
  LibraryCollectionResult 
} from '../models/linkCollection';

// Web Link Collector API endpoint
export const collectLinksFunction = app.http('collectLinks', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'collectLinks',
  handler: async (
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    context.log('collectLinks: Function started');

    try {
      // Parse request body
      const requestBody = (await request.json()) as CollectionRequest;
      const { url, selector, options = {} } = requestBody;

      if (!url) {
        context.warn('collectLinks: URL not provided');
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: 'URLが必要です'
          } as CollectionResult,
        };
      }

      context.log(`collectLinks: Starting collection for URL "${url}"`);

      // Prepare collection options
      const collectionConfig = {
        ...options,
        selector: selector || undefined,
        logLevel: 'info' as const,
        delayMs: options.delayMs || 1000,
        depth: options.depth || 1,
      };

      // Start collection
      const startTime = Date.now();
      const results: LibraryCollectionResult = await collectLinks(url, collectionConfig);
      const processingTime = Date.now() - startTime;

      context.log(
        `collectLinks: Collection completed successfully. Found ${results.allCollectedUrls.length} URLs in ${processingTime}ms`
      );

      // Prepare response
      const response: CollectionResult = {
        success: true,
        data: {
          allCollectedUrls: results.allCollectedUrls,
          linkRelationships: results.linkRelationships,
          stats: {
            totalPages: results.linkRelationships.length,
            totalLinks: results.allCollectedUrls.length,
            uniqueLinks: [...new Set(results.allCollectedUrls)].length,
            processingTime: results.stats.durationMs,
          },
        },
        collectedAt: new Date().toISOString(),
      };

      return {
        status: 200,
        jsonBody: response,
      };
    } catch (error) {
      context.error('collectLinks: Error occurred', error);

      const errorResponse: CollectionResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      return {
        status: 500,
        jsonBody: errorResponse,
      };
    }
  },
});