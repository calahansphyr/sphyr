/* eslint-disable react/no-children-prop */
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { List } from 'react-window';
import { Loader2 } from 'lucide-react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight?: number | ((index: number) => number);
  height: number;
  width?: number | string;
  renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  overscanCount?: number;
  onScroll?: (scrollOffset: number) => void;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemHeight = 50,
  height,
  width = '100%',
  renderItem,
  loading = false,
  emptyState,
  className = '',
  overscanCount = 5,
  onScroll,
  onItemsRendered
}: VirtualizedListProps<T>) {
  const listRef = useRef<{ scrollToItem: (index: number) => void } | null>(null);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const scrollOffset = event.currentTarget.scrollTop;
      onScroll?.(scrollOffset);
    },
    [onScroll]
  );

  const handleItemsRendered = useCallback(
    ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
      onItemsRendered?.(startIndex, endIndex);
    },
    [onItemsRendered]
  );

  const getItemSize = useCallback(
    (index: number) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight]
  );

  const itemData = useMemo(() => ({
    items,
    renderItem
  }), [items, renderItem]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-text-muted"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
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

  const ListComponent = List;

  return (
    <div className={className}>
      <ListComponent
        ref={listRef}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={getItemSize}
        itemData={itemData}
        overscanCount={overscanCount}
        onScroll={handleScroll}
        onItemsRendered={handleItemsRendered}
        // @ts-expect-error - react-window expects render prop as children
        children={({ index, style, data }: { index: number; style: React.CSSProperties; data: { items: T[]; renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode } }) => {
          const { items: listItems, renderItem: renderItemFn } = data;
          return renderItemFn({ index, style, item: listItems[index] });
        }}
      />
    </div>
  );
}

// Hook for virtualized list state management
export function useVirtualizedList<T>(
  items: T[],
  _options: {
    itemHeight?: number | ((index: number) => number);
    height: number;
    overscanCount?: number;
  } = { height: 400 }
) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleItemsRendered = useCallback(
    (startIndex: number, endIndex: number) => {
      setVisibleRange({ start: startIndex, end: endIndex });
    },
    []
  );

  const handleScroll = useCallback((offset: number) => {
    setScrollOffset(offset);
  }, []);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  return {
    visibleRange,
    scrollOffset,
    visibleItems,
    handleItemsRendered,
    handleScroll
  };
}

export default VirtualizedList;
