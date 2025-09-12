import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ExternalLink,
  Download,
  Share2,
  MoreHorizontal,
  Star,
  Filter,
  SortAsc
} from 'lucide-react';
import { IntegrationBadge } from '@/components/integrations';
import { AISearchResult } from '@/types/ai';
import { cn } from '@/lib/utils';

interface MobileResultsListProps {
  results: AISearchResult[];
  query: string;
  isLoading?: boolean;
  className?: string;
  onResultClick?: (result: AISearchResult) => void;
  onLoadMore?: () => void;
}

const MobileResultsList: React.FC<MobileResultsListProps> = ({
  results,
  query,
  isLoading = false,
  className = "",
  onResultClick,
  onLoadMore
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'confidence'>('relevance');

  const formatTimestamp = (createdAt: string) => {
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

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'confidence':
        return ((b.metadata?.confidence as number) || 0) - ((a.metadata?.confidence as number) || 0);
      default:
        return 0; // Keep original order for relevance
    }
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {results.length} results for &ldquo;{query}&rdquo;
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'confidence')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:border-transparent"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-2 gap-3">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD]">
                  <option>All types</option>
                  <option>Documents</option>
                  <option>Emails</option>
                  <option>Messages</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8FCD]">
                  <option>All time</option>
                  <option>Last 24 hours</option>
                  <option>Last week</option>
                  <option>Last month</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {sortedResults.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onResultClick?.(result)}
            className="bg-white rounded-xl border border-gray-200 hover:border-[#3A8FCD] hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-[#3A8FCD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-[#3A8FCD]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                      {result.title}
                    </h3>
                    <div className="flex items-center gap-2">
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
                <button className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Content Preview */}
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {result.content}
              </p>

              {/* Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    getConfidenceColor(result.metadata?.confidence as number),
                    result.metadata?.confidence && (result.metadata.confidence as number) >= 0.8 ? "bg-green-50" :
                    result.metadata?.confidence && (result.metadata.confidence as number) >= 0.6 ? "bg-yellow-50" : "bg-red-50"
                  )}>
                    <Star className="h-3 w-3" />
                    <span>{getConfidenceLabel(result.metadata?.confidence as number)}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(result.metadata?.type as string) || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Share">
                    <Share2 className="h-4 w-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download">
                    <Download className="h-4 w-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Open">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {onLoadMore && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onLoadMore}
          className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-[#3A8FCD] hover:bg-[#3A8FCD]/5 transition-colors font-medium text-gray-600 hover:text-[#3A8FCD]"
        >
          Load More Results
        </motion.button>
      )}
    </div>
  );
};

export default MobileResultsList;
