/**
 * Search Service
 * Core search functionality and business logic
 */

import { apiClient } from '../api-client';
import { SEARCH_CONFIG } from '../constants';
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
      console.error('Search error:', error);
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
      console.error('Suggestions error:', error);
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
      console.error('Search history error:', error);
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
      console.error('Save search history error:', error);
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
      console.error('Clear search history error:', error);
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
      console.error('Search analytics error:', error);
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
      console.error('Get sources error:', error);
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
      console.error('Get search result error:', error);
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
