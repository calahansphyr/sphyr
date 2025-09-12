import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  FileText,
  User,
  Tag,
  Save,
  Bookmark,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  History,
  Clock,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { userBehaviorTracker } from '@/lib/analytics/UserBehaviorTracker';

export interface SearchFilter {
  id: string;
  type: 'date_range' | 'file_type' | 'author' | 'integration' | 'tags' | 'size' | 'visibility';
  label: string;
  value: unknown;
  operator?: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
}

// Type guards for filter values
function isDateRangeValue(value: unknown): value is { from: Date; to: Date } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'from' in value &&
    'to' in value &&
    value.from instanceof Date &&
    value.to instanceof Date
  );
}

function isStringValue(value: unknown): value is string {
  return typeof value === 'string';
}


export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  sort: SearchSort;
  isPublic: boolean;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface AdvancedSearchFeaturesProps {
  onSearch: (query: string, filters: SearchFilter[], sort: SearchSort) => void;
  onSaveSearch?: (savedSearch: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>) => void;
  onLoadSavedSearch?: (savedSearch: SavedSearch) => void;
  className?: string;
  showAdvancedOptions?: boolean;
  showSavedSearches?: boolean;
  showSearchHistory?: boolean;
}

export const AdvancedSearchFeatures: React.FC<AdvancedSearchFeaturesProps> = ({
  onSearch,
  onSaveSearch,
  onLoadSavedSearch,
  className = "",
  showAdvancedOptions = true,
  showSavedSearches = true,
  showSearchHistory = true
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [sort, setSort] = useState<SearchSort>({ field: 'relevance', direction: 'desc', label: 'Relevance' });
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearchesPanel, setShowSavedSearchesPanel] = useState(false);
  const [showSearchHistoryPanel, setShowSearchHistoryPanel] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Available filter types
  const filterTypes: Array<{
    type: SearchFilter['type'];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = useMemo(() => [
    { type: 'date_range', label: 'Date Range', icon: Calendar },
    { type: 'file_type', label: 'File Type', icon: FileText },
    { type: 'author', label: 'Author', icon: User },
    { type: 'integration', label: 'Integration', icon: Globe },
    { type: 'tags', label: 'Tags', icon: Tag },
    { type: 'size', label: 'File Size', icon: FileText },
    { type: 'visibility', label: 'Visibility', icon: Eye }
  ], []);

  // Available sort options
  const sortOptions: SearchSort[] = [
    { field: 'relevance', direction: 'desc', label: 'Relevance' },
    { field: 'date', direction: 'desc', label: 'Date (Newest)' },
    { field: 'date', direction: 'asc', label: 'Date (Oldest)' },
    { field: 'title', direction: 'asc', label: 'Title (A-Z)' },
    { field: 'title', direction: 'desc', label: 'Title (Z-A)' },
    { field: 'size', direction: 'desc', label: 'Size (Largest)' },
    { field: 'size', direction: 'asc', label: 'Size (Smallest)' },
    { field: 'author', direction: 'asc', label: 'Author (A-Z)' }
  ];

  // File type options
  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'doc', label: 'Word Documents' },
    { value: 'xls', label: 'Excel Spreadsheets' },
    { value: 'ppt', label: 'PowerPoint Presentations' },
    { value: 'txt', label: 'Text Files' },
    { value: 'jpg', label: 'Images (JPG)' },
    { value: 'png', label: 'Images (PNG)' },
    { value: 'mp4', label: 'Videos (MP4)' },
    { value: 'mp3', label: 'Audio (MP3)' }
  ];

  // Integration options
  const integrationOptions = [
    { value: 'gmail', label: 'Gmail' },
    { value: 'google_drive', label: 'Google Drive' },
    { value: 'slack', label: 'Slack' },
    { value: 'asana', label: 'Asana' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'outlook', label: 'Outlook' },
    { value: 'onedrive', label: 'OneDrive' }
  ];

  // Size options
  const sizeOptions = [
    { value: 'small', label: 'Small (< 1MB)' },
    { value: 'medium', label: 'Medium (1-10MB)' },
    { value: 'large', label: 'Large (10-100MB)' },
    { value: 'xlarge', label: 'Very Large (> 100MB)' }
  ];

  // Visibility options
  const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'shared', label: 'Shared' },
    { value: 'restricted', label: 'Restricted' }
  ];

  // Load saved searches and history from localStorage
  useEffect(() => {
    const loadSavedSearches = () => {
      try {
        const saved = localStorage.getItem('sphyr_saved_searches');
        if (saved) {
          setSavedSearches(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    };

    const loadSearchHistory = () => {
      try {
        const history = localStorage.getItem('sphyr_search_history');
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    };

    loadSavedSearches();
    loadSearchHistory();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Track search event
      userBehaviorTracker.trackEvent('search', {
        query,
        filters: filters.map(f => ({ type: f.type, value: f.value })),
        sort: sort.field,
        sortDirection: sort.direction,
        hasAdvancedFilters: filters.length > 0
      });

      // Add to search history
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 20);
      setSearchHistory(newHistory);
      localStorage.setItem('sphyr_search_history', JSON.stringify(newHistory));

      // Perform search
      await onSearch(query, filters, sort);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, sort, onSearch, searchHistory]);

  const addFilter = useCallback((type: SearchFilter['type']) => {
    const newFilter: SearchFilter = {
      id: `filter_${Date.now()}`,
      type,
      label: filterTypes.find(ft => ft.type === type)?.label || type,
      value: type === 'date_range' ? { from: undefined, to: undefined } : '',
      operator: type === 'date_range' ? 'between' : 'contains'
    };
    setFilters(prev => [...prev, newFilter]);
  }, [filterTypes]);

  const updateFilter = useCallback((filterId: string, updates: Partial<SearchFilter>) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const saveSearch = useCallback(() => {
    if (!query.trim()) return;

    const savedSearch: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'> = {
      name: query.length > 30 ? `${query.substring(0, 30)}...` : query,
      query,
      filters,
      sort,
      isPublic: false
    };

    onSaveSearch?.(savedSearch);

    // Add to local saved searches
    const newSavedSearch: SavedSearch = {
      ...savedSearch,
      id: `saved_${Date.now()}`,
      createdAt: new Date(),
      useCount: 0
    };

    const updatedSavedSearches = [newSavedSearch, ...savedSearches];
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem('sphyr_saved_searches', JSON.stringify(updatedSavedSearches));
  }, [query, filters, sort, onSaveSearch, savedSearches]);

  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setSort(savedSearch.sort);
    setShowSavedSearchesPanel(false);

    // Update use count
    const updatedSavedSearches = savedSearches.map(search =>
      search.id === savedSearch.id 
        ? { ...search, useCount: search.useCount + 1, lastUsed: new Date() }
        : search
    );
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem('sphyr_saved_searches', JSON.stringify(updatedSavedSearches));

    onLoadSavedSearch?.(savedSearch);
  }, [savedSearches, onLoadSavedSearch]);

  const deleteSavedSearch = useCallback((savedSearchId: string) => {
    const updatedSavedSearches = savedSearches.filter(search => search.id !== savedSearchId);
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem('sphyr_saved_searches', JSON.stringify(updatedSavedSearches));
  }, [savedSearches]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('sphyr_search_history');
  }, []);

  const renderFilterInput = (filter: SearchFilter) => {
    switch (filter.type) {
      case 'date_range':
        return (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {isDateRangeValue(filter.value) && filter.value.from ? format(filter.value.from, 'MMM dd') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <input
                  type="date"
                  value={isDateRangeValue(filter.value) && filter.value.from ? format(filter.value.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateFilter(filter.id, { 
                    value: isDateRangeValue(filter.value) 
                      ? { ...filter.value, from: e.target.value ? new Date(e.target.value) : null }
                      : { from: e.target.value ? new Date(e.target.value) : null, to: null }
                  })}
                  className="w-full p-2 border rounded"
                />
              </PopoverContent>
            </Popover>
            <span className="text-sm text-gray-500">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {isDateRangeValue(filter.value) && filter.value.to ? format(filter.value.to, 'MMM dd') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <input
                  type="date"
                  value={isDateRangeValue(filter.value) && filter.value.to ? format(filter.value.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateFilter(filter.id, { 
                    value: isDateRangeValue(filter.value) 
                      ? { ...filter.value, to: e.target.value ? new Date(e.target.value) : null }
                      : { from: null, to: e.target.value ? new Date(e.target.value) : null }
                  })}
                  className="w-full p-2 border rounded"
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'file_type':
        return (
          <Select 
            value={isStringValue(filter.value) ? filter.value : undefined} 
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              {fileTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'integration':
        return (
          <Select 
            value={isStringValue(filter.value) ? filter.value : undefined} 
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select integration" />
            </SelectTrigger>
            <SelectContent>
              {integrationOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'size':
        return (
          <Select 
            value={isStringValue(filter.value) ? filter.value : undefined} 
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {sizeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'visibility':
        return (
          <Select 
            value={isStringValue(filter.value) ? filter.value : undefined} 
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'author':
      case 'tags':
      default:
        return (
          <Input
            value={isStringValue(filter.value) ? filter.value : ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder={`Enter ${filter.label.toLowerCase()}`}
            className="w-48"
          />
        );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all your connected platforms..."
            className="pl-10 pr-4"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={!query.trim() || isSearching}
          className="px-6"
        >
          {isSearching ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Search className="w-4 h-4" />
            </motion.div>
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters {filters.length > 0 && `(${filters.length})`}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <Select value={`${sort.field}_${sort.direction}`} onValueChange={(value) => {
            const [field, direction] = value.split('_');
            const sortOption = sortOptions.find(s => s.field === field && s.direction === direction);
            if (sortOption) setSort(sortOption);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={`${option.field}_${option.direction}`} value={`${option.field}_${option.direction}`}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showSavedSearches && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavedSearchesPanel(!showSavedSearchesPanel)}
              className="flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              Saved
            </Button>
          )}

          {showSearchHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearchHistoryPanel(!showSearchHistoryPanel)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={saveSearch}
            disabled={!query.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Search
          </Button>
        </div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Search Filters</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={filters.length === 0}
                >
                  Clear All
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-1">
                      {filterTypes.map(filterType => (
                        <Button
                          key={filterType.type}
                          variant="ghost"
                          size="sm"
                          onClick={() => addFilter(filterType.type)}
                          className="w-full justify-start"
                        >
                          <filterType.icon className="w-4 h-4 mr-2" />
                          {filterType.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-3">
              {filters.map(filter => (
                <div key={filter.id} className="flex items-center gap-3 p-3 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const FilterIcon = filterTypes.find(ft => ft.type === filter.type)?.icon;
                      return FilterIcon ? <FilterIcon className="w-4 h-4 text-gray-500" /> : null;
                    })()}
                    <Label className="text-sm font-medium">{filter.label}</Label>
                  </div>
                  {renderFilterInput(filter)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Searches Panel */}
      <AnimatePresence>
        {showSavedSearchesPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Saved Searches</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedSearchesPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {savedSearches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saved searches yet</p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map(savedSearch => (
                  <div key={savedSearch.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{savedSearch.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {savedSearch.useCount} uses
                        </Badge>
                        {savedSearch.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{savedSearch.query}</p>
                      {savedSearch.filters.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Filter className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {savedSearch.filters.length} filter{savedSearch.filters.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedSearch(savedSearch)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedSearch(savedSearch.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search History Panel */}
      <AnimatePresence>
        {showSearchHistoryPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Search History</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSearchHistory}
                  disabled={searchHistory.length === 0}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearchHistoryPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No search history</p>
            ) : (
              <div className="space-y-1">
                {searchHistory.map((historyItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                    onClick={() => setQuery(historyItem)}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm">{historyItem}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchFeatures;
