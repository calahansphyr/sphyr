/**
 * Query Processor Module
 * Handles AI-powered query processing and intent analysis
 */

import { CerebrasClient } from '@/lib/ai/cerebras-client';
import { logger } from '@/lib/logger';
import { AdapterFactory } from '@/lib/integrations/adapter-factory';
import type { AllAdapters } from '@/lib/integrations/adapter-factory';

export interface QueryProcessingRequest {
  originalQuery: string;
  userId: string;
  organizationId: string;
  adapters: AllAdapters;
}

export interface QueryProcessingResult {
  processedQuery: string;
  intent: {
    type: string;
    category: string;
    confidence: number;
  };
}

export class QueryProcessor {
  private cerebrasClient: CerebrasClient;

  constructor() {
    this.cerebrasClient = new CerebrasClient();
  }

  /**
   * Process a search query with AI to understand intent and optimize the query
   */
  async processQuery(request: QueryProcessingRequest): Promise<QueryProcessingResult> {
    const { originalQuery, userId, organizationId, adapters } = request;
    
    const queryProcessingRequest = {
      originalQuery: originalQuery.trim(),
      context: {
        userHistory: [], // In production, fetch from user's search history
        organizationData: { organizationId },
        recentSearches: [], // In production, fetch recent searches
        activeIntegrations: AdapterFactory.getAvailableAdapters(adapters),
      },
      userId,
      organizationId,
    };

    const queryProcessing = await this.cerebrasClient.processQuery(queryProcessingRequest);
    
    logger.info('Query processed successfully', { 
      originalQuery,
      processedQuery: queryProcessing.processedQuery,
      intent: queryProcessing.intent,
    });

    return {
      processedQuery: queryProcessing.processedQuery || originalQuery.trim(),
      intent: queryProcessing.intent,
    };
  }
}
