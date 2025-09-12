/* eslint-disable react/no-children-prop */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface InfiniteVirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: number | string;
  renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  hasNextPage: boolean;
  isLoading: boolean;
  hasError?: boolean;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  className?: string;
  overscanCount?: number;
  threshold?: number;
}

export function InfiniteVirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  loadMoreItems,
  hasNextPage,
  isLoading,
  hasError = false,
  emptyState,
  errorState,
  className = '',
  overscanCount = 5,
  threshold = 5
}: InfiniteVirtualizedListProps<T>) {
  const listRef = useRef<{ scrollToItem: (index: number) => void } | null>(null);
  const [isItemLoaded, setIsItemLoaded] = useState<boolean[]>([]);

  // Update loaded state when items change
  useEffect(() => {
    setIsItemLoaded(new Array(items.length).fill(true));
  }, [items.length]);

  const isItemLoadedCallback = useCallback(
    (index: number) => {
      return isItemLoaded[index] || false;
    },
    [isItemLoaded]
  );

  const loadMoreItemsCallback = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (isLoading) return;
      
      try {
        await loadMoreItems(startIndex, stopIndex);
      } catch (error) {
        logger.error('Failed to load more items', error as Error, {
          operation: 'loadMoreItems',
          startIndex,
          stopIndex
        });
      }
    },
    [loadMoreItems, isLoading]
  );

  const itemData = useMemo(() => ({
    items,
    renderItem,
    isLoading
  }), [items, renderItem, isLoading]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {errorState || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 text-text-muted"
          >
            <AlertCircle className="h-8 w-8" />
            <p>Failed to load items</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {emptyState || (
          <div className="text-center text-text-muted">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <InfiniteLoader
        isItemLoaded={isItemLoadedCallback}
        itemCount={hasNextPage ? items.length + 1 : items.length}
        loadMoreItems={loadMoreItemsCallback}
        threshold={threshold}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list: { scrollToItem: (index: number) => void } | null) => {
              ref(list);
              listRef.current = list;
            }}
            height={height}
            width={width}
            itemCount={hasNextPage ? items.length + 1 : items.length}
            itemSize={itemHeight}
            itemData={itemData}
            overscanCount={overscanCount}
            onItemsRendered={onItemsRendered}
            // @ts-expect-error - react-window expects render prop as children
            children={({ index, style, data }: { index: number; style: React.CSSProperties; data: { items: T[]; renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode; isLoading: boolean } }) => {
              const { items: listItems, renderItem: renderItemFn } = data;
              
              // Show loading indicator for the last item when loading more
              if (index === listItems.length && hasNextPage) {
                return (
                  <div style={style} className="flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-text-muted"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more...</span>
                    </motion.div>
                  </div>
                );
              }
              
              return renderItemFn({ index, style, item: listItems[index] });
            }}
          />
        )}
      </InfiniteLoader>
    </div>
  );
}

// Hook for infinite virtualized list state management
export function useInfiniteVirtualizedList<T>(
  initialItems: T[] = [],
  options: {
    itemHeight: number;
    height: number;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<T[]>;
    hasNextPage: boolean;
    threshold?: number;
  }
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(options.hasNextPage);

  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (isLoading) return;
      
      setIsLoading(true);
      setHasError(false);
      
      try {
        const newItems = await options.loadMoreItems(startIndex, stopIndex);
        setItems(prev => [...prev, ...newItems]);
        
        // Update hasNextPage based on the number of items returned
        if (newItems.length === 0) {
          setHasNextPage(false);
        }
      } catch (error) {
        logger.error('Failed to load more items', error as Error, {
          operation: 'handleLoadMore',
          currentItemsCount: items.length
        });
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [options, isLoading]
  );

  const reset = useCallback(() => {
    setItems(initialItems);
    setHasError(false);
    setHasNextPage(options.hasNextPage);
  }, [initialItems, options.hasNextPage]);

  return {
    items,
    isLoading,
    hasError,
    hasNextPage,
    loadMoreItems,
    reset
  };
}

export default InfiniteVirtualizedList;
