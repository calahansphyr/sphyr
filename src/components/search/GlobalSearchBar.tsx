import React, { useState, useRef, useEffect } from 'react';
import { Search, Brain, Sparkles, ArrowRight, Clock, TrendingUp, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AISearchResult } from '@/types/ai';

export interface GlobalSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, filters?: SearchFilters, sort?: SearchSort) => void;
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  showAIBranding?: boolean;
  size?: 'small' | 'default' | 'large';
  disabled?: boolean;
  loading?: boolean;
  showSuggestions?: boolean;
  showAdvancedOptions?: boolean;
  onResultClick?: (result: AISearchResult) => void;
  recentSearches?: string[];
  savedSearches?: SavedSearch[];
}

export interface SearchFilters {
  dateRange?: { from: Date | null; to: Date | null };
  fileType?: string[];
  author?: string[];
  integration?: string[];
  tags?: string[];
  size?: { min: number; max: number };
  visibility?: 'public' | 'private' | 'shared';
}

export interface SearchSort {
  field: 'relevance' | 'date' | 'title' | 'source';
  direction: 'asc' | 'desc';
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  sort: SearchSort;
  createdAt: string;
  useCount: number;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  placeholder = "Search across all your connected platforms...",
  onSearch,
  onChange,
  value,
  className = "",
  showAIBranding = true,
  size = "default",
  disabled = false,
  loading = false,
  showSuggestions = true,
  showAdvancedOptions = false,
  recentSearches = [],
  savedSearches = []
}) => {
  const [query, setQuery] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SearchSort>({ field: 'relevance', direction: 'desc' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // Generate suggestions based on query
  useEffect(() => {
    if (query.length > 2 && showSuggestions) {
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
      
      const filteredSuggestions = mockSuggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5);
      
      setSuggestions(filteredSuggestions);
      setShowSuggestionsPanel(true);
    } else {
      setShowSuggestionsPanel(false);
    }
  }, [query, showSuggestions]);

  // Handle clicks outside suggestions panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestionsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch && query.trim() && !disabled && !loading) {
      onSearch(query.trim(), filters, sort);
      setShowSuggestionsPanel(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onChange?.(suggestion);
    if (onSearch) {
      onSearch(suggestion, filters, sort);
    }
    setShowSuggestionsPanel(false);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    onChange?.(search);
    if (onSearch) {
      onSearch(search, filters, sort);
    }
    setShowSuggestionsPanel(false);
  };

  const handleSavedSearchClick = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setSort(savedSearch.sort);
    onChange?.(savedSearch.query);
    if (onSearch) {
      onSearch(savedSearch.query, savedSearch.filters, savedSearch.sort);
    }
    setShowSuggestionsPanel(false);
  };

  const clearQuery = () => {
    setQuery('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const sizeClasses = {
    small: 'h-10 text-sm',
    default: 'h-12 text-base',
    large: 'h-16 text-lg'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    default: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  const isDisabled = disabled || loading;

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative flex items-center bg-white border-2 rounded-xl transition-all duration-200",
          isFocused && !isDisabled ? 'border-primary-500 shadow-lg' : 'border-border-light hover:border-border-medium',
          isDisabled && 'opacity-50 cursor-not-allowed',
          sizeClasses[size]
        )}>
          {/* AI Brain Icon */}
          {showAIBranding && (
            <div className="flex items-center pl-4 pr-2">
              <motion.div
                animate={isFocused && !isDisabled ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Brain className={cn(iconSizes[size], "text-primary-500")} />
              </motion.div>
            </div>
          )}

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isDisabled}
            className="flex-1 bg-transparent outline-none placeholder-text-tertiary font-medium disabled:cursor-not-allowed"
            aria-label="Search input"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-2 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Advanced Options Toggle */}
          {showAdvancedOptions && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "p-2 text-text-tertiary hover:text-text-secondary transition-colors",
                showAdvanced && "text-primary-500"
              )}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            disabled={isDisabled || !query.trim()}
            className={cn(
              "flex items-center justify-center px-4 h-full text-white rounded-r-xl transition-colors duration-200",
              isDisabled || !query.trim() 
                ? "bg-neutral-400 cursor-not-allowed" 
                : "bg-primary-500 hover:bg-primary-600"
            )}
            aria-label={loading ? "Searching..." : "Search"}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className={iconSizes[size]} />
              </motion.div>
            ) : (
              <Search className={iconSizes[size]} />
            )}
          </button>
        </div>
      </form>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestionsPanel && (suggestions.length > 0 || recentSearches.length > 0 || savedSearches.length > 0) && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-border-light z-50"
          >
            <div className="p-4">
              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium text-text-secondary">AI Suggestions</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 hover:bg-background-secondary rounded-lg transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-text-primary group-hover:text-primary-500 transition-colors">
                            {suggestion}
                          </span>
                          <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-primary-500 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    <span className="text-sm font-medium text-text-secondary">Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full text-left p-3 hover:bg-background-secondary rounded-lg transition-colors group"
                      >
                        <span className="text-text-primary group-hover:text-primary-500 transition-colors">
                          {search}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-text-tertiary" />
                    <span className="text-sm font-medium text-text-secondary">Saved Searches</span>
                  </div>
                  <div className="space-y-1">
                    {savedSearches.slice(0, 3).map((savedSearch) => (
                      <button
                        key={savedSearch.id}
                        onClick={() => handleSavedSearchClick(savedSearch)}
                        className="w-full text-left p-3 hover:bg-background-secondary rounded-lg transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-text-primary group-hover:text-primary-500 transition-colors">
                            {savedSearch.name}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {savedSearch.useCount} uses
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearchBar;
