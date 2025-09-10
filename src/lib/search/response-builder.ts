/**
 * Response Builder Module
 * Builds the final search response with ranking and analytics
 */

import { CerebrasClient } from '@/lib/ai/cerebras-client';
import { productAnalytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import type { AISearchResult, RankedSearchResult } from '@/types/ai';

export interface SmartSearchResponse {
  message: string;
  data: RankedSearchResult[];
  query: string;
  processedQuery: string;
  intent: {
    type: string;
    category: string;
    confidence: number;
  };
  rankingExplanation: string;
  executionTime: number;
  timestamp: string;
}

export interface ResponseBuilderRequest {
  originalQuery: string;
  processedQuery: string;
  intent: {
    type: string;
    category: string;
    confidence: number;
  };
  aiSearchResults: AISearchResult[];
  executionTime: number;
  userId: string;
  organizationId: string;
  requestId: string;
}

export class ResponseBuilder {
  private cerebrasClient: CerebrasClient;

  constructor() {
    this.cerebrasClient = new CerebrasClient();
  }

  /**
   * Build the final search response with AI ranking
   */
  async buildResponse(request: ResponseBuilderRequest): Promise<SmartSearchResponse> {
    const {
      originalQuery,
      processedQuery,
      intent,
      aiSearchResults,
      executionTime,
      userId,
      organizationId,
      requestId,
    } = request;

    // Step 4: Rank results using AI
    const rankingRequest = {
      query: originalQuery.trim(),
      results: aiSearchResults,
      context: {
        userHistory: [], // In production, fetch from user's search history
        organizationData: { organizationId },
        recentSearches: [], // In production, fetch recent searches
        activeIntegrations: this.getActiveIntegrations(aiSearchResults),
      },
    };

    const rankingResponse = await this.cerebrasClient.rankResults(rankingRequest);
    
    logger.info('Results ranked successfully', { 
      totalResults: aiSearchResults.length,
      rankedResults: rankingResponse.rankedResults.length,
      requestId,
    });

    // Track search analytics
    await this.trackSearchAnalytics({
      userId,
      organizationId,
      query: originalQuery,
      resultCount: rankingResponse.rankedResults.length,
      executionTime,
      requestId,
    });

    // Build final response
    const response: SmartSearchResponse = {
      message: 'Smart search completed successfully',
      data: rankingResponse.rankedResults,
      query: originalQuery.trim(),
      processedQuery,
      intent,
      rankingExplanation: rankingResponse.rankingExplanation,
      executionTime,
      timestamp: new Date().toISOString(),
    };

    return response;
  }

  /**
   * Get active integrations from search results
   */
  private getActiveIntegrations(results: AISearchResult[]): string[] {
    const integrations = new Set<string>();
    results.forEach(result => {
      integrations.add(result.integrationType);
    });
    return Array.from(integrations);
  }

  /**
   * Track search analytics
   */
  private async trackSearchAnalytics(data: {
    userId: string;
    organizationId: string;
    query: string;
    resultCount: number;
    executionTime: number;
    requestId: string;
  }): Promise<void> {
    try {
      await productAnalytics.trackEvent({
        type: 'search_performed',
        userId: data.userId,
        organizationId: data.organizationId,
        properties: {
          query: data.query,
          resultCount: data.resultCount,
          executionTime: data.executionTime,
          requestId: data.requestId,
        },
      });
    } catch (error) {
      logger.warn('Failed to track search analytics', { 
        error: (error as Error).message,
        requestId: data.requestId,
      });
    }
  }
}
