/**
 * Search Page
 * Demonstrates the search functionality
 */

import React, { useState } from 'react';
import { SearchBar } from '@/components/search';
import { SearchResult } from '@/types/integrations';

export default function SearchPage(): React.JSX.Element {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState<string>('');

  const handleSearchComplete = (results: SearchResult[]) => {
    setResults(results);
    setLastQuery(''); // We don't have the query in this callback
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI-Powered Search
          </h1>
          <p className="text-gray-600">
            Search across all your connected tools and integrations
          </p>
        </div>

        <div className="mb-8">
          <SearchBar 
            onSearchComplete={handleSearchComplete}
            className="max-w-2xl mx-auto"
          />
        </div>

        {lastQuery && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Results for &quot;{lastQuery}&quot;
            </h2>
            
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {result.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Source: {result.source}
                      </span>
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No results found</p>
              </div>
            )}
          </div>
        )}

        {!lastQuery && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to search
            </h3>
            <p className="text-gray-500">
              Enter a search query above to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
