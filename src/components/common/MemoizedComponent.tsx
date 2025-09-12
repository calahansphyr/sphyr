import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MemoizedComponentProps {
  children: React.ReactNode;
  className?: string;
  animation?: boolean;
  animationProps?: {
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    transition?: Record<string, unknown>;
  };
  compareFn?: (prevProps: Record<string, unknown>, nextProps: Record<string, unknown>) => boolean;
}

// Higher-order component for memoizing components
export function withMemoization<P extends object>(
  Component: React.ComponentType<P>,
  compareFn?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, compareFn);
}

// Memoized wrapper component
export const MemoizedComponent = memo<MemoizedComponentProps>(
  ({ children, className = '', animation = true, animationProps, ...props }) => {
    const defaultAnimationProps = useMemo(() => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3 }
    }), []);

    const finalAnimationProps = useMemo(() => ({
      ...defaultAnimationProps,
      ...animationProps
    }), [defaultAnimationProps, animationProps]);

    if (animation) {
      return (
        <motion.div
          className={className}
          {...finalAnimationProps}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }
);

MemoizedComponent.displayName = 'MemoizedComponent';

// Memoized list component for rendering large lists
export const MemoizedList = memo<{
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  keyExtractor: (item: unknown, index: number) => string | number;
  className?: string;
  itemClassName?: string;
  animation?: boolean;
}>(({ items, renderItem, keyExtractor, className = '', itemClassName = '', animation = true }) => {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      item,
      index,
      key: keyExtractor(item, index)
    }));
  }, [items, keyExtractor]);

  const renderMemoizedItem = useCallback(({ item, index, key }: { item: unknown; index: number; key: string | number }) => {
    if (animation) {
      return (
        <motion.div
          key={key}
          className={itemClassName}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {renderItem(item, index)}
        </motion.div>
      );
    }

    return (
      <div key={key} className={itemClassName}>
        {renderItem(item, index)}
      </div>
    );
  }, [renderItem, itemClassName, animation]);

  return (
    <div className={className}>
      {memoizedItems.map(renderMemoizedItem)}
    </div>
  );
});

MemoizedList.displayName = 'MemoizedList';

// Memoized grid component
export const MemoizedGrid = memo<{
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  keyExtractor: (item: unknown, index: number) => string | number;
  columns?: number;
  gap?: number;
  className?: string;
  itemClassName?: string;
  animation?: boolean;
}>(({ 
  items, 
  renderItem, 
  keyExtractor, 
  columns = 3, 
  gap = 4, 
  className = '', 
  itemClassName = '', 
  animation = true 
}) => {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      item,
      index,
      key: keyExtractor(item, index)
    }));
  }, [items, keyExtractor]);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap * 0.25}rem`
  }), [columns, gap]);

  const renderMemoizedItem = useCallback(({ item, index, key }: { item: unknown; index: number; key: string | number }) => {
    if (animation) {
      return (
        <motion.div
          key={key}
          className={itemClassName}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {renderItem(item, index)}
        </motion.div>
      );
    }

    return (
      <div key={key} className={itemClassName}>
        {renderItem(item, index)}
      </div>
    );
  }, [renderItem, itemClassName, animation]);

  return (
    <div className={className} style={gridStyle}>
      {memoizedItems.map(renderMemoizedItem)}
    </div>
  );
});

MemoizedGrid.displayName = 'MemoizedGrid';

// Memoized card component
export const MemoizedCard = memo<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  animation?: boolean;
  onClick?: () => void;
}>(({ children, className = '', hover = true, animation = true, onClick }) => {
  const cardClassName = useMemo(() => {
    const baseClasses = 'bg-background-primary border border-border rounded-lg p-4 shadow-sm';
    const hoverClasses = hover ? 'hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer' : '';
    return `${baseClasses} ${hoverClasses} ${className}`;
  }, [className, hover]);

  if (animation) {
    return (
      <motion.div
        className={cardClassName}
        onClick={onClick}
        whileHover={hover ? { scale: 1.02 } : undefined}
        whileTap={hover ? { scale: 0.98 } : undefined}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClassName} onClick={onClick}>
      {children}
    </div>
  );
});

MemoizedCard.displayName = 'MemoizedCard';

export default MemoizedComponent;
