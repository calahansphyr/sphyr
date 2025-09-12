import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Sparkles, X, Mic, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onVoiceSearch?: () => void;
  onImageSearch?: () => void;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  onVoiceSearch,
  onImageSearch,
  className = "",
  value = "",
  onChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
            boxShadow: isFocused 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative flex items-center bg-white border-2 rounded-2xl transition-all duration-200",
            isFocused ? 'border-[#3A8FCD]' : 'border-gray-200',
            "h-14 px-4"
          )}
        >
          {/* AI Icon */}
          <div className="flex items-center pr-3">
            <motion.div
              animate={isFocused ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Brain className="h-5 w-5 text-[#3A8FCD]" />
            </motion.div>
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none placeholder-gray-500 text-base font-medium"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pl-3">
            {/* Clear Button */}
            <AnimatePresence>
              {inputValue && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Voice Search Button */}
            {onVoiceSearch && (
              <button
                onClick={onVoiceSearch}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
                aria-label="Voice search"
              >
                <Mic className="h-4 w-4 text-gray-500" />
              </button>
            )}

            {/* Image Search Button */}
            {onImageSearch && (
              <button
                onClick={onImageSearch}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
                aria-label="Image search"
              >
                <Camera className="h-4 w-4 text-gray-500" />
              </button>
            )}

            {/* Search Button */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={cn(
                "flex items-center justify-center px-4 py-2 rounded-xl transition-colors font-medium",
                inputValue.trim()
                  ? "bg-[#3A8FCD] text-white hover:bg-[#4D70B6]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </form>

      {/* AI Branding */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 flex items-center justify-center"
          >
            <div className="flex items-center gap-2 px-3 py-1 bg-[#3A8FCD]/10 rounded-full">
              <Sparkles className="h-3 w-3 text-[#3A8FCD]" />
              <span className="text-xs font-medium text-[#3A8FCD]">
                Powered by Cerebras AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSearchBar;
