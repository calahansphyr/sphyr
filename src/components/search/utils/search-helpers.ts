/**
 * Search utility functions
 * Helper functions for search-related operations
 */

import { SEARCH_CONFIG } from '@/lib/constants';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  type: 'document' | 'message' | 'task' | 'contact' | 'file';
  relevanceScore: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  query: string;
  filters?: {
    sources?: string[];
    types?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  limit?: number;
  offset?: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  resultsCount: number;
  timestamp: string;
  filters?: SearchQuery['filters'];
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): {
  isValid: boolean;
  error?: string;
} {
  if (!query || query.trim().length === 0) {
    return {
      isValid: false,
      error: 'Search query cannot be empty',
    };
  }
  
  if (query.trim().length < SEARCH_CONFIG.minQueryLength) {
    return {
      isValid: false,
      error: `Search query must be at least ${SEARCH_CONFIG.minQueryLength} characters long`,
    };
  }
  
  if (query.length > 500) {
    return {
      isValid: false,
      error: 'Search query is too long (maximum 500 characters)',
    };
  }
  
  return { isValid: true };
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that might cause issues
    .substring(0, 500); // Limit length
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query || !text) return text;
  
  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  let highlightedText = text;
  
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
    );
  });
  
  return highlightedText;
}

/**
 * Extract search suggestions from query
 */
export function extractSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  
  // Add the full query as a suggestion
  suggestions.push(query);
  
  // Add partial queries (removing last word)
  const words = query.split(' ');
  if (words.length > 1) {
    for (let i = words.length - 1; i > 0; i--) {
      suggestions.push(words.slice(0, i).join(' '));
    }
  }
  
  // Add common search patterns
  const commonPatterns = [
    'from:',
    'to:',
    'type:',
    'date:',
    'has:',
  ];
  
  commonPatterns.forEach(pattern => {
    if (!query.includes(pattern)) {
      suggestions.push(`${query} ${pattern}`);
    }
  });
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Calculate relevance score for search results
 */
export function calculateRelevanceScore(
  result: SearchResult,
  query: string
): number {
  const queryLower = query.toLowerCase();
  const titleLower = result.title.toLowerCase();
  const contentLower = result.content.toLowerCase();
  
  let score = 0;
  
  // Title matches are weighted higher
  if (titleLower.includes(queryLower)) {
    score += 10;
  }
  
  // Content matches
  if (contentLower.includes(queryLower)) {
    score += 5;
  }
  
  // Exact phrase matches
  if (titleLower === queryLower) {
    score += 20;
  }
  
  // Word boundary matches
  const queryWords = queryLower.split(/\s+/);
  queryWords.forEach(word => {
    if (titleLower.includes(word)) {
      score += 3;
    }
    if (contentLower.includes(word)) {
      score += 1;
    }
  });
  
  // Boost recent results
  const resultDate = new Date(result.timestamp);
  const now = new Date();
  const daysDiff = (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDiff < 7) {
    score += 2;
  } else if (daysDiff < 30) {
    score += 1;
  }
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Format search result timestamp
 */
export function formatSearchTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get search result type icon
 */
export function getSearchResultTypeIcon(type: SearchResult['type']): string {
  const icons = {
    document: '📄',
    message: '💬',
    task: '✅',
    contact: '👤',
    file: '📁',
  };
  
  return icons[type] || '📄';
}

/**
 * Build search URL with query parameters
 */
export function buildSearchUrl(query: string, filters?: SearchQuery['filters']): string {
  const params = new URLSearchParams();
  params.set('q', query);
  
  if (filters?.sources) {
    params.set('sources', filters.sources.join(','));
  }
  
  if (filters?.types) {
    params.set('types', filters.types.join(','));
  }
  
  if (filters?.dateRange) {
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
  }
  
  return `/search?${params.toString()}`;
}
