import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Sparkles, ArrowRight, Clock, TrendingUp, Filter } from 'lucide-react';
import EnhancedSearchBar from './EnhancedSearchBar';
import EnhancedSearchResults from './EnhancedSearchResults';
import { LoadingState } from '@/components/shared';
import { AISearchResult } from '@/types/ai';
import { cn } from '@/lib/utils';

interface SearchFlowProps {
  className?: string;
  onSearchComplete?: (results: AISearchResult[]) => void;
}

interface SearchState {
  query: string;
  isSearching: boolean;
  results: AISearchResult[];
  hasSearched: boolean;
  searchTime: number;
  suggestions: string[];
}

const SearchFlow: React.FC<SearchFlowProps> = ({
  className = "",
  onSearchComplete
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isSearching: false,
    results: [],
    hasSearched: false,
    searchTime: 0,
    suggestions: []
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock search suggestions based on common construction queries
  const mockSuggestions = [
    "Q4 budget planning documents",
    "client meeting notes from last week",
    "expense reports for project Alpha",
    "RFI responses from subcontractors",
    "change order approvals",
    "safety inspection reports",
    "material delivery schedules",
    "project timeline updates"
  ];

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchState(prev => ({
      ...prev,
      query: query.trim(),
      isSearching: true,
      hasSearched: true
    }));

    setShowSuggestions(false);

    // Simulate search time
    const startTime = Date.now();
    
    // Mock search results - in real implementation, this would call your search API
    const mockResults: AISearchResult[] = [
      {
        id: '1',
        title: 'Q4 Budget Planning Document',
        content: 'Comprehensive budget planning for Q4 2024 including material costs, labor estimates, and contingency planning...',
        source: 'Google Drive',
        integrationType: 'google_drive',
        metadata: {
          type: 'document',
          confidence: 0.95,
          size: '2.3 MB',
          lastModified: '2024-01-15T10:30:00Z'
        },
        url: 'https://drive.google.com/file/d/123',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Client Meeting Notes - Project Alpha',
        content: 'Meeting notes from client discussion about project timeline, budget concerns, and scope changes...',
        source: 'Gmail',
        integrationType: 'google_gmail',
        metadata: {
          type: 'email',
          confidence: 0.88,
          from: 'client@company.com',
          date: '2024-01-14T14:00:00Z'
        },
        url: 'https://mail.google.com/mail/u/0/#inbox/123',
        createdAt: '2024-01-14T14:00:00Z'
      },
      {
        id: '3',
        title: 'Expense Report - January 2024',
        content: 'Monthly expense report including travel, materials, and equipment costs for Project Alpha...',
        source: 'QuickBooks',
        integrationType: 'quickbooks',
        metadata: {
          type: 'document',
          confidence: 0.92,
          amount: '$15,450.00',
          category: 'Project Expenses'
        },
        url: 'https://quickbooks.intuit.com/reports/123',
        createdAt: '2024-01-13T09:15:00Z'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const searchTime = Date.now() - startTime;

    setSearchState(prev => ({
      ...prev,
      isSearching: false,
      results: mockResults,
      searchTime
    }));

    onSearchComplete?.(mockResults);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchState(prev => ({ ...prev, query: suggestion }));
    handleSearch(suggestion);
  };

  const handleQueryChange = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
    setShowSuggestions(query.length > 2);
  };

  const getSearchInsights = () => {
    if (!searchState.hasSearched || searchState.isSearching) return null;

    const resultCount = searchState.results.length;
    const avgConfidence = searchState.results.reduce((acc, result) => 
      acc + ((result.metadata?.confidence as number) || 0), 0) / resultCount;
    const searchTimeSeconds = (searchState.searchTime / 1000).toFixed(1);

    return {
      resultCount,
      avgConfidence: Math.round(avgConfidence * 100),
      searchTime: searchTimeSeconds,
      topSources: [...new Set(searchState.results.map(r => r.source))].slice(0, 3)
    };
  };

  const insights = getSearchInsights();

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3A8FCD] rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI-Powered Search
              </h1>
            </div>
            
            <div className="max-w-2xl mx-auto relative">
              <EnhancedSearchBar
                placeholder="Search across all your connected platforms..."
                onSearch={handleSearch}
                showAIBranding={true}
                size="large"
                className="shadow-lg"
                value={searchState.query}
                onChange={handleQueryChange}
              />
              
              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && searchState.query.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-20"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-[#3A8FCD]" />
                        <span className="text-sm font-medium text-gray-600">AI Suggestions</span>
                      </div>
                      <div className="space-y-1">
                        {mockSuggestions
                          .filter(suggestion => 
                            suggestion.toLowerCase().includes(searchState.query.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((suggestion, index) => (
                            <motion.button
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 group-hover:text-[#3A8FCD] transition-colors">
                                  {suggestion}
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3A8FCD] transition-colors" />
                              </div>
                            </motion.button>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Insights */}
            {insights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>{insights.resultCount} results found</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#3A8FCD]" />
                  <span>{insights.avgConfidence}% avg confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{insights.searchTime}s search time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <span>From {insights.topSources.join(', ')}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1">
        {searchState.isSearching ? (
          <LoadingState
            type="search"
            message="Searching across your platforms..."
            submessage="AI is analyzing your query and finding the most relevant results"
            size="lg"
          />
        ) : searchState.hasSearched ? (
          <EnhancedSearchResults
            query={searchState.query}
            results={searchState.results}
            isLoading={false}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#3A8FCD]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-[#3A8FCD]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Search
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Start typing to search across all your connected platforms. Our AI will help you find exactly what you&apos;re looking for.
              </p>
              
              {/* Quick Search Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: Brain, label: "Budget planning documents", query: "Q4 budget planning" },
                  { icon: Clock, label: "Recent meeting notes", query: "client meeting notes" },
                  { icon: TrendingUp, label: "Expense reports", query: "expense reports" },
                  { icon: Filter, label: "Project updates", query: "project timeline updates" }
                ].map((example, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                    onClick={() => handleSearch(example.query)}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#3A8FCD] hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#3A8FCD]/10 rounded-lg flex items-center justify-center">
                      <example.icon className="h-5 w-5 text-[#3A8FCD]" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 group-hover:text-[#3A8FCD] transition-colors">
                        {example.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        Try: &ldquo;{example.query}&rdquo;
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFlow;
