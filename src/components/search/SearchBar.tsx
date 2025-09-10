/**
 * SearchBar Component
 * Main search input component with form handling
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postSearchQuery } from '@/lib/api-client';
import { SearchResult } from '@/types';
import { logger } from '@/lib/logger';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearchComplete?: (results: SearchResult[]) => void;
}

interface ApiSearchResult {
  id: number;
  title: string;
  content: string;
  source: string;
  url?: string;
}

export default function SearchBar({ 
  placeholder = "Search across all your connected tools...", 
  className = "",
  onSearchComplete
}: SearchBarProps): React.JSX.Element {
  const [query, setQuery] = useState('');

  const searchMutation = useMutation({
    mutationFn: postSearchQuery,
    onSuccess: (data) => {
      logger.info('Search completed successfully', { 
        resultCount: data.data.length,
        query: query 
      });
      // Transform API response to SearchResult format
      const transformedResults: SearchResult[] = data.data.map((result: ApiSearchResult) => ({
        id: result.id.toString(),
        title: result.title,
        content: result.content,
        source: result.source,
        integrationType: 'google_gmail' as const,
        metadata: {},
        url: result.url,
        createdAt: new Date().toISOString(),
      }));
      onSearchComplete?.(transformedResults);
    },
    onError: (error) => {
      logger.error('Search failed', error as Error, { 
        query: query 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <button
        type="submit"
        disabled={!query.trim() || searchMutation.isPending}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {searchMutation.isPending ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
