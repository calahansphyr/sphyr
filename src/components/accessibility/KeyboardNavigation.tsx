import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KeyboardNavigationProps {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  wrap?: boolean;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onActivate?: (index: number) => void;
  onFocus?: (index: number) => void;
  initialFocusIndex?: number;
  disabled?: boolean;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  className = '',
  orientation = 'both',
  loop = false,
  wrap = false,
  onNavigate,
  onActivate,
  onFocus,
  initialFocusIndex = 0,
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setFocusedIndex] = useState(initialFocusIndex);
  const [items, setItems] = useState<HTMLElement[]>([]);

  // Get all focusable items
  useEffect(() => {
    if (!containerRef.current) return;

    const focusableItems = Array.from(
      containerRef.current.querySelectorAll(
        '[data-keyboard-navigable="true"], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    setItems(focusableItems);
  }, [children]);

  // Set initial focus
  useEffect(() => {
    if (items.length > 0 && initialFocusIndex < items.length) {
      items[initialFocusIndex]?.focus();
      setFocusedIndex(initialFocusIndex);
    }
  }, [items, initialFocusIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) return;

      const currentIndex = items.findIndex(item => item === document.activeElement);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;
      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (event.key) {
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            direction = 'up';
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : wrap ? items.length - 1 : 0;
            }
          }
          break;
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            direction = 'down';
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : wrap ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            direction = 'left';
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : wrap ? items.length - 1 : 0;
            }
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            direction = 'right';
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : wrap ? 0 : items.length - 1;
            }
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onActivate?.(currentIndex);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
      }

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
        items[newIndex]?.focus();
        setFocusedIndex(newIndex);
        onFocus?.(newIndex);
        if (direction) {
          onNavigate?.(direction);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, orientation, loop, wrap, onNavigate, onActivate, onFocus, disabled]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "focus:outline-none",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      role="group"
      aria-label="Keyboard navigable content"
    >
      {children}
    </div>
  );
};

interface FocusIndicatorProps {
  isVisible: boolean;
  position: { x: number; y: number; width: number; height: number };
  className?: string;
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  isVisible,
  position,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute pointer-events-none border-2 border-[#3A8FCD] rounded-lg bg-[#3A8FCD]/10",
            className
          )}
          style={{
            left: position.x - 2,
            top: position.y - 2,
            width: position.width + 4,
            height: position.height + 4,
            zIndex: 1000
          }}
        />
      )}
    </AnimatePresence>
  );
};

interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey) {
        setIsVisible(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setTimeout(() => setIsVisible(false), 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          href={href}
          className={cn(
            "absolute top-4 left-4 z-50 px-4 py-2 bg-[#3A8FCD] text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A8FCD]",
            className
          )}
          onBlur={() => setIsVisible(false)}
        >
          {children}
        </motion.a>
      )}
    </AnimatePresence>
  );
};

interface AccessibleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ariaLabel,
  ariaDescribedBy,
  loading = false,
  icon,
  iconPosition = 'left'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#3A8FCD] hover:bg-[#4D70B6] text-white focus:ring-[#3A8FCD]';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500';
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

interface AccessibleInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  id?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className = '',
  id
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText ? `${inputId}-help` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[errorId, helpId].filter(Boolean).join(' ') || undefined}
        className={cn(
          "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:border-transparent transition-colors",
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:border-[#3A8FCD]",
          disabled && "bg-gray-50 cursor-not-allowed"
        )}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

const KeyboardNavigationComponents = {
  KeyboardNavigation,
  FocusIndicator,
  SkipLink,
  AccessibleButton,
  AccessibleInput
};

export default KeyboardNavigationComponents;
