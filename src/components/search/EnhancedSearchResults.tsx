import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Clock,
  TrendingUp,
  Star,
  ExternalLink,
  Download,
  Share2,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { IntegrationBadge } from '@/components/integrations';
import { AISearchResult } from '@/types/ai';
import { cn } from '@/lib/utils';

interface EnhancedSearchResultsProps {
  query: string;
  results: AISearchResult[];
  isLoading?: boolean;
  className?: string;
  onResultClick?: (result: AISearchResult) => void;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
  active: boolean;
}

interface SortOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  query,
  results,
  isLoading = false,
  className = "",
  onResultClick
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterOption[]>([
    { id: 'all', label: 'All Results', count: results.length, active: true },
    { id: 'recent', label: 'Recent', count: results.filter(r => r.createdAt && new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, active: false },
    { id: 'high-confidence', label: 'High Confidence', count: results.filter(r => r.metadata?.confidence && (r.metadata.confidence as number) > 0.8).length, active: false },
    { id: 'documents', label: 'Documents', count: results.filter(r => r.metadata?.type === 'document').length, active: false },
    { id: 'emails', label: 'Emails', count: results.filter(r => r.metadata?.type === 'email').length, active: false },
  ]);

  const sortOptions: SortOption[] = [
    { id: 'relevance', label: 'Relevance', icon: TrendingUp },
    { id: 'date', label: 'Date', icon: Clock },
    { id: 'confidence', label: 'Confidence', icon: Star },
  ];

  const handleFilterChange = (filterId: string) => {
    setFilters(prev => prev.map(filter => ({
      ...filter,
      active: filter.id === filterId
    })));
  };

  const getFilteredResults = () => {
    const activeFilter = filters.find(f => f.active);
    if (!activeFilter || activeFilter.id === 'all') return results;

    switch (activeFilter.id) {
      case 'recent':
        return results.filter(r => r.createdAt && new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      case 'high-confidence':
        return results.filter(r => r.metadata?.confidence && (r.metadata.confidence as number) > 0.8);
      case 'documents':
        return results.filter(r => r.metadata?.type === 'document');
      case 'emails':
        return results.filter(r => r.metadata?.type === 'email');
      default:
        return results;
    }
  };

  const getSortedResults = (filteredResults: AISearchResult[]) => {
    switch (sortBy) {
      case 'date':
        return [...filteredResults].sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      case 'confidence':
        return [...filteredResults].sort((a, b) => ((b.metadata?.confidence as number) || 0) - ((a.metadata?.confidence as number) || 0));
      default:
        return filteredResults;
    }
  };

  const filteredAndSortedResults = getSortedResults(getFilteredResults());

  const formatTimestamp = (createdAt?: string) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
              </h1>
              <p className="text-gray-600 mt-1">
                {isLoading ? 'Searching...' : `${filteredAndSortedResults.length} results for "${query}"`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
              </button>

              <div className="flex items-center gap-2">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                      filter.active
                        ? "bg-[#3A8FCD] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD]">
                      <option>All time</option>
                      <option>Last 24 hours</option>
                      <option>Last week</option>
                      <option>Last month</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD]">
                      <option>All types</option>
                      <option>Documents</option>
                      <option>Emails</option>
                      <option>Messages</option>
                      <option>Files</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD]">
                      <option>All levels</option>
                      <option>High (80%+)</option>
                      <option>Medium (60-80%)</option>
                      <option>Low (Below 60%)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A8FCD] mx-auto mb-4"></div>
              <p className="text-gray-600">Searching across your connected platforms...</p>
            </div>
          </div>
        ) : filteredAndSortedResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => setFilters(prev => prev.map(f => ({ ...f, active: f.id === 'all' })))}
              className="text-[#3A8FCD] hover:text-[#4D70B6] font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div 
            className={cn(
              "space-y-4",
              viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            )}
            data-testid="search-results"
          >
            {filteredAndSortedResults.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => onResultClick?.(result)}
                className={cn(
                  "bg-white rounded-xl border border-gray-200 hover:border-[#3A8FCD] hover:shadow-lg transition-all duration-200 cursor-pointer group",
                  viewMode === 'list' ? "p-6" : "p-4"
                )}
                data-testid="search-result"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#3A8FCD]/10 rounded-lg flex items-center justify-center">
                      <Search className="h-5 w-5 text-[#3A8FCD]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#3A8FCD] transition-colors line-clamp-2">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <IntegrationBadge 
                          integration={result.integrationType as 'gmail' | 'drive' | 'calendar' | 'slack' | 'hubspot' | 'quickbooks' | 'asana' | 'outlook'} 
                          size="xs" 
                        />
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(result.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      getConfidenceColor(result.metadata?.confidence as number),
                      result.metadata?.confidence && (result.metadata.confidence as number) >= 0.8 ? "bg-green-50" :
                      result.metadata?.confidence && (result.metadata.confidence as number) >= 0.6 ? "bg-yellow-50" : "bg-red-50"
                    )}>
                      {getConfidenceLabel(result.metadata?.confidence as number)} {result.metadata?.confidence ? `(${Math.round((result.metadata.confidence as number) * 100)}%)` : ''}
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {result.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{(result.metadata?.type as string) || 'Unknown'}</span>
                    {(result.metadata?.size as string) && (
                      <>
                        <span>•</span>
                        <span>{result.metadata.size as string}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-100 rounded-lg" title="Share">
                      <Share2 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-lg" title="Download">
                      <Download className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-lg" title="Open">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSearchResults;
