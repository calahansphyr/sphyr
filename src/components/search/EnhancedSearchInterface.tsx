import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import { useErrorHandler } from '@/lib/utils/error-handler';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Star, 
  StarOff,
  TrendingUp,
  Clock,
  X,
  Sparkles,
  Zap,
  BookmarkCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { searchHistoryManager, SearchHistoryItem } from '@/lib/search/SearchHistoryManager';
import { smartFilters, SearchFilter } from '@/lib/search/SmartFilters';
import { searchAnalytics } from '@/lib/search/SearchAnalytics';
import { aiSearchSuggestions, SearchSuggestion } from '@/lib/search/AISearchSuggestions';
import { SearchResult } from '@/types/integrations';

interface EnhancedSearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilter[], sort: string) => void;
  onResultClick?: (result: SearchResult) => void;
  onResultExport?: (result: SearchResult) => void;
  className?: string;
  placeholder?: string;
  showAdvancedOptions?: boolean;
  showHistory?: boolean;
  showFavorites?: boolean;
  showSuggestions?: boolean;
}

export const EnhancedSearchInterface: React.FC<EnhancedSearchInterfaceProps> = ({
  onSearch,
  className = "",
  placeholder = "Search across all your connected platforms...",
  showAdvancedOptions = true,
  showSuggestions = true
}) => {
  const { handleError } = useErrorHandler();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [sort, setSort] = useState('relevance');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<SearchHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'history' | 'favorites'>('suggestions');

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    setSearchHistory(searchHistoryManager.getRecentSearches(10));
    setFavorites(searchHistoryManager.getFavorites());
  }, []);

  const generateSuggestions = useCallback(async () => {
    try {
      const context = {
        currentQuery: query,
        searchHistory,
        recentResults: [], // This would come from recent search results
        userPreferences: {
          preferredSources: ['google', 'notion', 'slack'],
          commonFilters: {},
          searchPatterns: []
        }
      };

      const newSuggestions = await aiSearchSuggestions.generateSuggestions(query, context);
      setSuggestions(newSuggestions);
    } catch (error) {
      logger.error('Failed to generate suggestions', error as Error, {
        operation: 'generateSuggestions',
        query: query.substring(0, 100)
      });
    }
  }, [query, searchHistory]);

  // Generate suggestions when query changes
  useEffect(() => {
    if (query.length > 2 && showSuggestions) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query, showSuggestions, generateSuggestions]);

  // Handle clicks outside suggestions panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        // Suggestions panel closed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const startTime = Date.now();

    try {
      // Perform search (this would be the actual search implementation)
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Q4 Budget Planning Document',
          content: 'Budget planning for Q4 2024...',
          source: 'google',
          url: 'https://docs.google.com/document/1',
          createdAt: new Date().toISOString(),
          author: 'John Doe',
          tags: ['budget', 'planning', 'Q4']
        }
      ];

      // Track search metrics
      searchAnalytics.trackSearch(searchQuery, mockResults, Date.now() - startTime, {}, sort);
      
      // Add to search history
      searchHistoryManager.addSearchHistory(searchQuery, mockResults, 'global', {}, sort);
      
      // Update local state
      setSearchHistory(searchHistoryManager.getRecentSearches(10));

      // Call parent search handler
      onSearch(searchQuery, filters, sort);
    } catch (error) {
      handleError(error, {
        component: 'EnhancedSearchInterface',
        operation: 'handleSearch',
        context: { query: searchQuery.substring(0, 100) }
      });
      // Error is already logged by the error handler
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, sort, onSearch, handleError]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    handleSearch(suggestion.query);
  }, [handleSearch]);

  const handleHistoryClick = useCallback((item: SearchHistoryItem) => {
    setQuery(item.query);
    handleSearch(item.query);
  }, [handleSearch]);

  const handleFavoriteToggle = useCallback((item: SearchHistoryItem) => {
    if (searchHistoryManager.isFavorite(item.id)) {
      searchHistoryManager.removeFromFavorites(item.id);
    } else {
      searchHistoryManager.addToFavorites(item.id);
    }
    setFavorites(searchHistoryManager.getFavorites());
  }, []);

  const handleFilterAdd = useCallback((filterType: SearchFilter['type']) => {
    const newFilter = smartFilters.createFilter(filterType, '', 'equals');
    setFilters(prev => [...prev, newFilter]);
  }, []);


  const handleFilterRemove = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
  }, []);

  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
  }, []);

  const sortOptions = [
    { value: 'relevance', label: 'Relevance', icon: Sparkles },
    { value: 'date_desc', label: 'Newest First', icon: SortDesc },
    { value: 'date_asc', label: 'Oldest First', icon: SortAsc },
    { value: 'title_asc', label: 'Title A-Z', icon: SortAsc },
    { value: 'title_desc', label: 'Title Z-A', icon: SortDesc }
  ];

  return (
    <div className={cn("relative", className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-background-secondary border-2 border-border-light rounded-xl transition-all duration-200 hover:border-border-medium focus-within:border-primary-500 focus-within:shadow-md">
          {/* Search Icon */}
          <div className="flex items-center pl-4 pr-2">
            <Search className="h-5 w-5 text-text-muted" />
          </div>

          {/* Search Input */}
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
            onFocus={() => {
              if (suggestions.length > 0) {
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none placeholder-text-muted font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="flex items-center gap-2 pr-2">
              {/* Filters */}
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4" />
                    {filters.length > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
                        {filters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Filters</h4>
                      <Button variant="ghost" size="sm" onClick={() => setFilters([])}>
                        Clear All
                      </Button>
                    </div>
                    
                    {/* Filter List */}
                    <div className="space-y-2">
                      {filters.map(filter => (
                        <div key={filter.id} className="flex items-center gap-2 p-2 bg-background-tertiary rounded-lg">
                          <span className="text-sm font-medium">{filter.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFilterRemove(filter.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add Filter */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Add Filter</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {smartFilters.getFilterTypes().slice(0, 6).map(filterType => (
                          <Button
                            key={filterType.type}
                            variant="outline"
                            size="sm"
                            onClick={() => handleFilterAdd(filterType.type)}
                            className="text-xs"
                          >
                            {filterType.icon} {filterType.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Sort */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <SortAsc className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-2">
                    {sortOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={sort === option.value ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleSortChange(option.value)}
                        className="w-full justify-start"
                      >
                        <option.icon className="h-4 w-4 mr-2" />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="flex items-center justify-center px-4 h-full text-text-inverse rounded-r-xl transition-colors duration-200"
            data-testid="search-button"
          >
            {isSearching ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-5 w-5" />
              </motion.div>
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {(suggestions.length > 0 || searchHistory.length > 0 || favorites.length > 0) && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background-secondary rounded-xl shadow-lg border border-border-light z-50"
          >
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'suggestions' | 'history' | 'favorites')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="suggestions" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  History
                </TabsTrigger>
                <TabsTrigger value="favorites" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Favorites
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="p-4">
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 hover:bg-background-tertiary rounded-lg transition-colors cursor-pointer group"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          {suggestion.type === 'history' && <Clock className="h-4 w-4" />}
                          {suggestion.type === 'trending' && <TrendingUp className="h-4 w-4" />}
                          {suggestion.type === 'semantic' && <Sparkles className="h-4 w-4" />}
                          {suggestion.type === 'autocomplete' && <Search className="h-4 w-4" />}
                          {suggestion.type === 'related' && <Zap className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary-500 transition-colors">
                            {suggestion.query}
                          </p>
                          <p className="text-xs text-text-muted">{suggestion.reason}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="p-4">
                <div className="space-y-2">
                  {searchHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 hover:bg-background-tertiary rounded-lg transition-colors cursor-pointer group"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-text-muted" />
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary-500 transition-colors">
                            {item.query}
                          </p>
                          <p className="text-xs text-text-muted">
                            {item.source} • {item.resultCount} results
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle(item);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {searchHistoryManager.isFavorite(item.id) ? (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="favorites" className="p-4">
                <div className="space-y-2">
                  {favorites.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 hover:bg-background-tertiary rounded-lg transition-colors cursor-pointer group"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary-500 transition-colors">
                            {item.query}
                          </p>
                          <p className="text-xs text-text-muted">
                            {item.source} • {item.resultCount} results
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteToggle(item);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <BookmarkCheck className="h-3 w-3 text-yellow-500" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
