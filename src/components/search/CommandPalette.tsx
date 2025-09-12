import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Search, Brain, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IntegrationBadge, { IntegrationProvider } from '../integrations/IntegrationBadge';
import { cn } from '@/lib/utils';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  className?: string;
}

export interface RecentSearch {
  query: string;
  provider: IntegrationProvider;
  time: string;
}

export interface SearchSuggestion {
  query: string;
  providers: IntegrationProvider[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onSearch,
  className 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const recentSearches: RecentSearch[] = [
    { query: "budget meeting with John", provider: "gmail", time: "2 hours ago" },
    { query: "Q3 sales report", provider: "drive", time: "Yesterday" },
    { query: "project timeline", provider: "asana", time: "2 days ago" },
    { query: "client presentation", provider: "slides", time: "3 days ago" }
  ];

  const suggestions: SearchSuggestion[] = [
    { query: "quarterly planning documents", providers: ["drive", "docs"] },
    { query: "team meeting notes", providers: ["slack", "docs"] },
    { query: "expense reports", providers: ["quickbooks", "excel"] },
    { query: "customer feedback", providers: ["hubspot", "slack"] }
  ];

  const handleSubmit = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onClose();
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleSubmit();
      } else if (recentSearches[selectedIndex]) {
        handleSubmit(recentSearches[selectedIndex].query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, recentSearches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
            <DialogPanel
              className={cn(
                "w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden",
                className
              )}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
              {/* Search Input */}
              <div className="flex items-center p-4 border-b border-gray-100">
                <Brain className="h-5 w-5 text-[#3A8FCD] mr-3" aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search across all platforms with AI..."
                  className="flex-1 text-lg outline-none placeholder-gray-500"
                  autoFocus
                  aria-label="Command palette search input"
                />
                <div className="flex items-center gap-1 text-xs text-gray-400 ml-3">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>Cerebras AI</span>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {query.length === 0 ? (
                  <>
                    {/* Recent Searches */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        <span className="text-sm font-medium text-gray-600">Recent Searches</span>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <motion.button
                            key={index}
                            onClick={() => handleSubmit(search.query)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                              selectedIndex === index 
                                ? 'bg-[#3A8FCD]/10 border border-[#3A8FCD]/20' 
                                : 'hover:bg-gray-50'
                            )}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            aria-label={`Search for ${search.query}`}
                          >
                            <div className="flex items-center gap-3">
                              <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              <span className="font-medium">{search.query}</span>
                              <IntegrationBadge integration={search.provider} size="xs" />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{search.time}</span>
                              <ArrowRight className="h-3 w-3" aria-hidden="true" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="p-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-[#3A8FCD]" aria-hidden="true" />
                        <span className="text-sm font-medium text-gray-600">AI Suggestions</span>
                      </div>
                      <div className="space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            onClick={() => handleSubmit(suggestion.query)}
                            className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            aria-label={`Search for ${suggestion.query}`}
                          >
                            <div className="flex items-center gap-3">
                              <Brain className="h-4 w-4 text-[#3A8FCD]" aria-hidden="true" />
                              <span className="font-medium">{suggestion.query}</span>
                              <div className="flex gap-1">
                                {suggestion.providers.map(provider => (
                                  <IntegrationBadge key={provider} integration={provider} size="xs" />
                                ))}
                              </div>
                            </div>
                            <ArrowRight className="h-3 w-3 text-gray-400" aria-hidden="true" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Search Results Preview */
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-4 w-4 text-[#3A8FCD]" aria-hidden="true" />
                      <span className="text-sm font-medium text-gray-600">AI is analyzing your query...</span>
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-[#3A8FCD]/5 rounded-lg border border-[#3A8FCD]/20"
                    >
                      <p className="text-sm text-gray-600">
                        Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to search for &ldquo;{query}&rdquo; across all your connected platforms
                      </p>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded">↑↓</kbd> Navigate</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded">Enter</kbd> Search</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded">Esc</kbd> Close</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#3A8FCD]" aria-hidden="true" />
                    <span>Powered by Cerebras AI</span>
                  </div>
                </div>
              </div>
              </motion.div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
