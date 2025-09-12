import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X } from 'lucide-react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  delay?: number;
  showLoadingIndicator?: boolean;
  showClearButton?: boolean;
  icon?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export const DebouncedInput = forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({
    value,
    onChange,
    onDebouncedChange,
    delay = 300,
    showLoadingIndicator = true,
    showClearButton = true,
    icon,
    className = '',
    placeholder = 'Search...',
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [isTyping, setIsTyping] = useState(false);
    const debouncedValue = useDebounce(internalValue, delay);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update internal value when external value changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Handle debounced value changes
    useEffect(() => {
      if (debouncedValue !== value) {
        onDebouncedChange?.(debouncedValue);
      }
    }, [debouncedValue, value, onDebouncedChange]);

    // Handle typing state
    useEffect(() => {
      setIsTyping(internalValue !== debouncedValue);
    }, [internalValue, debouncedValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange(newValue);
    };

    const handleClear = () => {
      setInternalValue('');
      onChange('');
      onDebouncedChange?.('');
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear();
      }
      props.onKeyDown?.(e);
    };

    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          
          <Input
            ref={ref || inputRef}
            value={internalValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${icon ? 'pl-10' : ''} ${showClearButton && internalValue ? 'pr-10' : ''}`}
            {...props}
          />
          
          {showClearButton && internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showLoadingIndicator && isTyping && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

DebouncedInput.displayName = 'DebouncedInput';

// Specialized search input component
export const DebouncedSearchInput = forwardRef<HTMLInputElement, Omit<DebouncedInputProps, 'icon'>>(
  (props, ref) => {
    return (
      <DebouncedInput
        ref={ref}
        icon={<Search className="h-4 w-4" />}
        placeholder="Search..."
        {...props}
      />
    );
  }
);

DebouncedSearchInput.displayName = 'DebouncedSearchInput';

export default DebouncedInput;
