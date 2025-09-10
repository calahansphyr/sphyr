/**
 * Custom hook for search functionality
 * Provides search state management and methods
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchService } from '../lib/search/search-service';
import { logger } from '../lib/logger';
import type { SearchResult, SearchQuery, SearchHistoryItem } from '../components/search/utils/search-helpers';

interface UseSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  initialQuery?: string;
}

interface UseSearchReturn {
  // State
  query: string;
  results: SearchResult[];
  suggestions: string[];
  history: SearchHistoryItem[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  executionTime: number;
  
  // Methods
  setQuery: (query: string) => void;
  search: (query?: string, filters?: SearchQuery['filters']) => Promise<void>;
  clearResults: () => void;
  clearHistory: () => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  loadHistory: () => Promise<void>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    autoSearch = true,
    initialQuery = '',
  } = options;

  // State
  const [query, setQueryState] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  /**
   * Load search history
   */
  const loadHistory = useCallback(async () => {
    try {
      const historyData = await searchService.getSearchHistory();
      setHistory(historyData);
    } catch (err) {
      logger.error('Failed to load search history', err, {
        operation: 'load_search_history',
        component: 'useSearch'
      });
      setHistory([]);
    }
  }, []);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback(
    (searchQuery: string, filters?: SearchQuery['filters']) => {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout
      searchTimeoutRef.current = setTimeout(async () => {
        if (!searchQuery.trim()) {
          setResults([]);
          setTotalCount(0);
          setExecutionTime(0);
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          const response = await searchService.search(searchQuery, filters);
          
          setResults(response.results);
          setTotalCount(response.totalCount);
          setExecutionTime(response.executionTime);
          
          // Save to history
          await searchService.saveSearchHistory(
            searchQuery,
            response.totalCount,
            filters
          );

          // Update history if it's loaded
          if (history.length > 0) {
            await loadHistory();
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setResults([]);
          setTotalCount(0);
          setExecutionTime(0);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, history.length, loadHistory]
  );

  /**
   * Set query and trigger search if autoSearch is enabled
   */
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    
    if (autoSearch && newQuery !== lastSearchRef.current) {
      lastSearchRef.current = newQuery;
      debouncedSearch(newQuery);
    }
  }, [autoSearch, debouncedSearch]);

  /**
   * Perform search manually
   */
  const search = useCallback(async (searchQuery?: string, filters?: SearchQuery['filters']) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    lastSearchRef.current = queryToSearch;
    await debouncedSearch(queryToSearch, filters);
  }, [query, debouncedSearch]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setExecutionTime(0);
    setError(null);
  }, []);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(async () => {
    try {
      await searchService.clearSearchHistory();
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  }, []);

  /**
   * Get search suggestions
   */
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const newSuggestions = await searchService.getSuggestions(searchQuery);
      setSuggestions(newSuggestions);
    } catch (err) {
      logger.error('Failed to get search suggestions', err, {
        operation: 'get_search_suggestions',
        component: 'useSearch',
        query: query
      });
      setSuggestions([]);
    }
  }, []);

  /**
   * Load history on mount
   */
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      // Capture the current timeout value to avoid stale closure
      const timeoutId = searchTimeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    // State
    query,
    results,
    suggestions,
    history,
    isLoading,
    error,
    totalCount,
    executionTime,
    
    // Methods
    setQuery,
    search,
    clearResults,
    clearHistory,
    getSuggestions,
    loadHistory,
  };
}
