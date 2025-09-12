import { useState, useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  // Navigation keys
  nextKey?: string;
  previousKey?: string;
  firstKey?: string;
  lastKey?: string;
  
  // Selection keys
  selectKey?: string;
  toggleKey?: string;
  
  // Escape key
  escapeKey?: string;
  
  // Custom key handlers
  customKeys?: Record<string, () => void>;
  
  // Navigation behavior
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'both';
  
  // Focus management
  focusOnMount?: boolean;
  restoreFocus?: boolean;
  
  // Callbacks
  onNavigate?: (index: number, direction: 'next' | 'previous' | 'first' | 'last') => void;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
}

export interface KeyboardNavigationReturn {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  navigate: (direction: 'next' | 'previous' | 'first' | 'last') => void;
  select: (index?: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

export function useKeyboardNavigation(
  itemCount: number,
  options: KeyboardNavigationOptions = {}
): KeyboardNavigationReturn {
  const {
    nextKey = 'ArrowDown',
    previousKey = 'ArrowUp',
    firstKey = 'Home',
    lastKey = 'End',
    selectKey = 'Enter',
    toggleKey = ' ',
    escapeKey = 'Escape',
    customKeys = {},
    loop = true,
    orientation = 'vertical',
    focusOnMount = false,
    restoreFocus = false,
    onNavigate,
    onSelect,
    onEscape
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(focusOnMount);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus for restoration
  useEffect(() => {
    if (restoreFocus && !isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isActive, restoreFocus]);

  // Restore focus when deactivating
  useEffect(() => {
    if (!isActive && restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isActive, restoreFocus]);

  // Navigation functions
  const navigate = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    if (itemCount === 0) return;

    let newIndex = currentIndex;

    switch (direction) {
      case 'next':
        newIndex = loop ? (currentIndex + 1) % itemCount : Math.min(currentIndex + 1, itemCount - 1);
        break;
      case 'previous':
        newIndex = loop ? (currentIndex - 1 + itemCount) % itemCount : Math.max(currentIndex - 1, 0);
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = itemCount - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onNavigate?.(newIndex, direction);
    }
  }, [currentIndex, itemCount, loop, onNavigate]);

  const select = useCallback((index?: number) => {
    const targetIndex = index !== undefined ? index : currentIndex;
    onSelect?.(targetIndex);
  }, [currentIndex, onSelect]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = e.key;

    // Check for custom keys first
    if (customKeys[key]) {
      e.preventDefault();
      customKeys[key]();
      return;
    }

    // Handle navigation keys
    if (orientation === 'vertical' || orientation === 'both') {
      if (key === nextKey) {
        e.preventDefault();
        navigate('next');
        return;
      }
      if (key === previousKey) {
        e.preventDefault();
        navigate('previous');
        return;
      }
    }

    if (orientation === 'horizontal' || orientation === 'both') {
      if (key === 'ArrowRight') {
        e.preventDefault();
        navigate('next');
        return;
      }
      if (key === 'ArrowLeft') {
        e.preventDefault();
        navigate('previous');
        return;
      }
    }

    // Handle first/last keys
    if (key === firstKey) {
      e.preventDefault();
      navigate('first');
      return;
    }
    if (key === lastKey) {
      e.preventDefault();
      navigate('last');
      return;
    }

    // Handle selection keys
    if (key === selectKey || key === toggleKey) {
      e.preventDefault();
      select();
      return;
    }

    // Handle escape key
    if (key === escapeKey) {
      e.preventDefault();
      setIsActive(false);
      onEscape?.();
      return;
    }
  }, [
    isActive,
    nextKey,
    previousKey,
    firstKey,
    lastKey,
    selectKey,
    toggleKey,
    escapeKey,
    customKeys,
    orientation,
    navigate,
    select,
    onEscape
  ]);

  return {
    currentIndex,
    setCurrentIndex,
    navigate,
    select,
    handleKeyDown,
    isActive,
    setIsActive
  };
}

// Hook for arrow key navigation in grids
export function useGridNavigation(
  rows: number,
  cols: number,
  _options: KeyboardNavigationOptions = {}
) {
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    let newRow = currentRow;
    let newCol = currentCol;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'down':
        newRow = Math.min(rows - 1, currentRow + 1);
        break;
      case 'left':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'right':
        newCol = Math.min(cols - 1, currentCol + 1);
        break;
    }

    if (newRow !== currentRow || newCol !== currentCol) {
      setCurrentRow(newRow);
      setCurrentCol(newCol);
    }
  }, [currentRow, currentCol, rows, cols]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigate('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigate('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigate('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigate('right');
        break;
      case 'Home':
        e.preventDefault();
        setCurrentRow(0);
        setCurrentCol(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentRow(rows - 1);
        setCurrentCol(cols - 1);
        break;
    }
  }, [isActive, navigate, rows, cols]);

  return {
    currentRow,
    currentCol,
    setCurrentRow,
    setCurrentCol,
    navigate,
    handleKeyDown,
    isActive,
    setIsActive
  };
}

// Hook for roving tabindex
export function useRovingTabIndex(
  itemCount: number,
  options: { initialIndex?: number; loop?: boolean } = {}
) {
  const { initialIndex = 0, loop = true } = options;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const getTabIndex = useCallback((index: number) => {
    return index === activeIndex ? 0 : -1;
  }, [activeIndex]);

  const handleFocus = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setActiveIndex(prev => loop ? (prev + 1) % itemCount : Math.min(prev + 1, itemCount - 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setActiveIndex(prev => loop ? (prev - 1 + itemCount) % itemCount : Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
    }
  }, [itemCount, loop]);

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex,
    handleFocus,
    handleKeyDown
  };
}

export default useKeyboardNavigation;