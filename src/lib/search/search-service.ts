/**
 * Search Service
 * Core search functionality and business logic
 */

import { apiClient } from '../api-client';
import { SEARCH_CONFIG } from '../constants';
import { logger } from '../logger';
import type { SearchResult, SearchQuery, SearchHistoryItem } from '../../components/search/utils/search-helpers';

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  executionTime: number;
  suggestions?: string[];
}

export interface SearchFilters {
  sources?: string[];
  types?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  organizationId?: string;
}

class SearchService {
  private searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();

  /**
   * Perform a search query
   */
  async search(
    query: string,
    filters?: SearchFilters,
    limit = SEARCH_CONFIG.maxResults
  ): Promise<SearchResponse> {
    const cacheKey = this.getCacheKey(query, filters, limit);
    
    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CONFIG.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await apiClient.post<SearchResponse>('/search', {
        query: query.trim(),
        filters,
        limit,
      });

      // Cache the results
      this.searchCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      logger.error('Search operation failed', error instanceof Error ? error : new Error(String(error)), {
        operation: 'search',
        service: 'search-service',
        query: query
      });
      throw new Error('Failed to perform search');
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      const response = await apiClient.get<string[]>('/search/suggestions', {
        q: query,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get search suggestions', error instanceof Error ? error : new Error(String(error)), {
        operation: 'get_suggestions',
        service: 'search-service',
        query: query
      });
      return [];
    }
  }

  /**
   * Get search history for the current user
   */
  async getSearchHistory(limit = 20): Promise<SearchHistoryItem[]> {
    try {
      const response = await apiClient.get<SearchHistoryItem[]>('/search/history', {
        limit,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get search history', error instanceof Error ? error : new Error(String(error)), {
        operation: 'get_search_history',
        service: 'search-service'
      });
      return [];
    }
  }

  /**
   * Save search query to history
   */
  async saveSearchHistory(
    query: string,
    resultsCount: number,
    filters?: SearchQuery['filters']
  ): Promise<void> {
    try {
      await apiClient.post('/search/history', {
        query,
        resultsCount,
        filters,
      });
    } catch (error) {
      logger.error('Failed to save search history', error instanceof Error ? error : new Error(String(error)), {
        operation: 'save_search_history',
        service: 'search-service',
        query: query
      });
      // Don't throw - this is not critical
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    try {
      await apiClient.delete('/search/history');
    } catch (error) {
      logger.error('Failed to clear search history', error instanceof Error ? error : new Error(String(error)), {
        operation: 'clear_search_history',
        service: 'search-service'
      });
      throw new Error('Failed to clear search history');
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const response = await apiClient.get('/search/analytics', {
        timeRange,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get search analytics', error instanceof Error ? error : new Error(String(error)), {
        operation: 'get_search_analytics',
        service: 'search-service'
      });
      return null;
    }
  }

  /**
   * Get available search sources
   */
  async getAvailableSources(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/search/sources');
      return response.data;
    } catch (error) {
      logger.error('Failed to get search sources', error instanceof Error ? error : new Error(String(error)), {
        operation: 'get_search_sources',
        service: 'search-service'
      });
      return [];
    }
  }

  /**
   * Get search result by ID
   */
  async getSearchResult(resultId: string): Promise<SearchResult | null> {
    try {
      const response = await apiClient.get<SearchResult>(`/search/result/${resultId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get search result by ID', error instanceof Error ? error : new Error(String(error)), {
        operation: 'get_search_result',
        service: 'search-service',
        resultId: resultId
      });
      return null;
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Generate cache key for search parameters
   */
  private getCacheKey(
    query: string,
    filters?: SearchFilters,
    limit?: number
  ): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${query}:${filterStr}:${limit}`;
  }
}

// Export singleton instance
export const searchService = new SearchService();
