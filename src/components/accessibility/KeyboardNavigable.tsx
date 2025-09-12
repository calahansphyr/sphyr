import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useKeyboardNavigation, useRovingTabIndex } from '@/hooks/useKeyboardNavigation';
import { useARIA } from './ARIAProvider';

interface KeyboardNavigableProps {
  children: React.ReactNode;
  itemCount: number;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (index: number) => void;
  onNavigate?: (index: number, direction: string) => void;
  className?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface KeyboardNavigableRef {
  focus: () => void;
  focusItem: (index: number) => void;
  navigate: (direction: 'next' | 'previous' | 'first' | 'last') => void;
  select: (index?: number) => void;
}

export const KeyboardNavigable = forwardRef<KeyboardNavigableRef, KeyboardNavigableProps>(
  ({
    children,
    itemCount,
    orientation = 'vertical',
    loop = true,
    onSelect,
    onNavigate,
    className = '',
    role = 'listbox',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ...props
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { generateId } = useARIA();
    
    const {
      currentIndex,
      setCurrentIndex,
      navigate,
      select,
      handleKeyDown,
      isActive,
      setIsActive
    } = useKeyboardNavigation(itemCount, {
      orientation,
      loop,
      onNavigate,
      onSelect
    });

    const {
      activeIndex: _activeIndex,
      getTabIndex,
      handleFocus,
      handleKeyDown: handleRovingKeyDown
    } = useRovingTabIndex(itemCount, { loop });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        containerRef.current?.focus();
        setIsActive(true);
      },
      focusItem: (index: number) => {
        setCurrentIndex(index);
        setIsActive(true);
      },
      navigate,
      select
    }));

    const handleContainerKeyDown = (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      handleRovingKeyDown(e);
    };

    const handleItemFocus = (index: number) => {
      setCurrentIndex(index);
      handleFocus(index);
    };

    // Clone children and add navigation props
    const enhancedChildren = React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          ...(child.props as Record<string, unknown>),
          tabIndex: getTabIndex(index),
          'aria-selected': index === currentIndex,
          'aria-posinset': index + 1,
          'aria-setsize': itemCount,
          onFocus: () => handleItemFocus(index),
          onClick: () => {
            setCurrentIndex(index);
            select(index);
          }
        } as Record<string, unknown>);
      }
      return child;
    });

    return (
      <div
        ref={containerRef}
        className={`focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${className}`}
        role={role}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-activedescendant={`${generateId('item')}-${currentIndex}`}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={handleContainerKeyDown}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        {...props}
      >
        {enhancedChildren}
      </div>
    );
  }
);

KeyboardNavigable.displayName = 'KeyboardNavigable';

// Specialized components for common patterns
export const KeyboardNavigableList = forwardRef<KeyboardNavigableRef, Omit<KeyboardNavigableProps, 'role'>>(
  (props, ref) => (
    <KeyboardNavigable
      ref={ref}
      role="listbox"
      {...props}
    />
  )
);

KeyboardNavigableList.displayName = 'KeyboardNavigableList';

export const KeyboardNavigableMenu = forwardRef<KeyboardNavigableRef, Omit<KeyboardNavigableProps, 'role'>>(
  (props, ref) => (
    <KeyboardNavigable
      ref={ref}
      role="menu"
      {...props}
    />
  )
);

KeyboardNavigableMenu.displayName = 'KeyboardNavigableMenu';

export const KeyboardNavigableTabs = forwardRef<KeyboardNavigableRef, Omit<KeyboardNavigableProps, 'role'>>(
  (props, ref) => (
    <KeyboardNavigable
      ref={ref}
      role="tablist"
      orientation="horizontal"
      {...props}
    />
  )
);

KeyboardNavigableTabs.displayName = 'KeyboardNavigableTabs';

export const KeyboardNavigableGrid = forwardRef<KeyboardNavigableRef, Omit<KeyboardNavigableProps, 'role'>>(
  (props, ref) => (
    <KeyboardNavigable
      ref={ref}
      role="grid"
      orientation="both"
      {...props}
    />
  )
);

KeyboardNavigableGrid.displayName = 'KeyboardNavigableGrid';

export default KeyboardNavigable;
