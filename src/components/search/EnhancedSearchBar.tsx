import React, { useState } from 'react';
import { Search, Brain, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface EnhancedSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  showAIBranding?: boolean;
  size?: 'small' | 'default' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ 
  placeholder = "Search across all platforms with AI...", 
  onSearch,
  onChange,
  value,
  className = "",
  showAIBranding = true,
  size = "default",
  disabled = false,
  loading = false
}) => {
  const [query, setQuery] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch && query.trim() && !disabled && !loading) {
      onSearch(query.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange?.(e.target.value);
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
          isFocused && !isDisabled ? 'border-[#3A8FCD] sphyr-glow' : 'border-gray-200 hover:border-gray-300',
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
                <Brain className={cn(iconSizes[size], "text-[#3A8FCD]")} />
              </motion.div>
            </div>
          )}

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isDisabled}
            className="flex-1 bg-transparent outline-none placeholder-gray-500 font-medium disabled:cursor-not-allowed"
            aria-label="Search input"
          />

          {/* Search Button */}
          <button
            type="submit"
            disabled={isDisabled || !query.trim()}
            className={cn(
              "flex items-center justify-center px-4 h-full text-white rounded-r-xl transition-colors duration-200",
              isDisabled || !query.trim() 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-[#3A8FCD] hover:bg-[#4D70B6]"
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
    </div>
  );
};

export default EnhancedSearchBar;
