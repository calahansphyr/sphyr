/**
 * Enhanced Search Page
 * Demonstrates the enhanced search functionality with analytics
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/components/layout';
import { EnhancedSearchInterface, SearchAnalyticsDashboard } from '@/components/search';
import { SearchResult } from '@/types/integrations';
import { SearchFilter } from '@/lib/search/SmartFilters';
import { logger } from '@/lib/logger';
import { useErrorHandler } from '@/lib/utils/error-handler';
import { motion } from 'framer-motion';
import { Search, BarChart3, Filter, SortAsc } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SearchPage(): React.JSX.Element {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'analytics'>('search');

  // Get initial query from URL
  useEffect(() => {
    if (router.query.q && typeof router.query.q === 'string') {
      setLastQuery(router.query.q);
    }
  }, [router.query.q]);

  const handleSearch = (query: string, _filters: SearchFilter[], _sort: string) => {
    setLastQuery(query);
    setIsSearching(true);
    
    // Update URL with query
    router.push(`/search?q=${encodeURIComponent(query)}`, undefined, { shallow: true });

    // Simulate search (replace with actual search implementation)
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Test Document',
          content: 'This is a test document content',
          source: 'Google Drive',
          url: 'https://drive.google.com/test',
          createdAt: new Date().toISOString(),
          author: 'Test User',
          tags: ['test', 'document'],
          size: 245760,
          contentType: 'document'
        },
        {
          id: '2',
          title: 'Another Document',
          content: 'Another test document with different content',
          source: 'Gmail',
          url: 'https://mail.google.com/test',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'Test User 2',
          tags: ['test', 'document', 'another'],
          size: 128000,
          contentType: 'document'
        }
      ];

      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const handleResultClick = (result: SearchResult) => {
    // Track result click for analytics
    if (result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleResultExport = (result: SearchResult) => {
    // Track result export for analytics
    try {
      // In a production environment, this would send analytics data to your analytics service
      logger.info('Search result exported', {
        operation: 'result_export',
        component: 'SearchPage',
        resultId: result.id,
        resultSource: result.source,
        resultType: result.integrationType,
        timestamp: new Date().toISOString()
      });
      
      // For now, we'll use a simple browser-based analytics approach
      if (typeof window !== 'undefined' && (window as Window & { gtag?: (command: string, action: string, params: Record<string, unknown>) => void }).gtag) {
        (window as Window & { gtag: (command: string, action: string, params: Record<string, unknown>) => void }).gtag('event', 'search_result_export', {
          result_id: result.id,
          result_source: result.source,
          result_type: result.integrationType
        });
      }
    } catch (error) {
      handleError(error, {
        component: 'SearchPage',
        operation: 'result_export',
        context: { resultId: result.id }
      });
      // Error is already logged by the error handler
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-text-primary mb-4" data-testid="search-page-title">
              AI-Powered Search
            </h1>
            <p className="text-lg text-text-secondary">
              Search across all your connected tools and integrations with intelligent insights
            </p>
          </motion.div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'documents' | 'emails' | 'calendar' | 'files')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Enhanced Search Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <EnhancedSearchInterface
                onSearch={handleSearch}
                onResultClick={handleResultClick}
                onResultExport={handleResultExport}
                className="max-w-4xl mx-auto"
                placeholder="Search across all your connected platforms..."
                showAdvancedOptions={true}
                showHistory={true}
                showFavorites={true}
                showSuggestions={true}
              />
            </motion.div>

            {/* Search Results */}
            {lastQuery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text-primary">
                    Results for &quot;{lastQuery}&quot;
                  </h2>
                  {results.length > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {isSearching ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-background-secondary rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-background-secondary rounded w-full mb-2"></div>
                          <div className="h-3 bg-background-secondary rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-4" data-testid="search-results">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        data-testid="search-result"
                      >
                        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary-500 transition-colors">
                                  {result.title}
                                </h3>
                                <p className="text-text-secondary mb-4 line-clamp-2">
                                  {result.content}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-text-muted">
                                  <span className="flex items-center gap-1">
                                    <Filter className="h-3 w-3" />
                                    {result.source}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <SortAsc className="h-3 w-3" />
                                    {result.author}
                                  </span>
                                  <span>
                                    {new Date(result.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {result.tags && result.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {result.tags.slice(0, 4).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {result.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResultClick(result)}
                                  className="ml-4 group-hover:bg-primary-500 group-hover:text-white transition-colors"
                                >
                                  View
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Search className="h-12 w-12 text-text-muted mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        No results found
                      </h3>
                      <p className="text-text-secondary">
                        Try adjusting your search terms or filters
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Empty State */}
            {!lastQuery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-16 w-16 text-text-muted mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-text-primary mb-3">
                      Ready to Search
                    </h3>
                    <p className="text-text-secondary mb-6 max-w-md mx-auto">
                      Enter a search query above to discover content across all your connected platforms. 
                      Use natural language for the best results.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="secondary">AI-powered</Badge>
                      <Badge variant="secondary">Smart filters</Badge>
                      <Badge variant="secondary">Search history</Badge>
                      <Badge variant="secondary">Analytics</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SearchAnalyticsDashboard 
                showExportButton={true}
                refreshInterval={30000}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
