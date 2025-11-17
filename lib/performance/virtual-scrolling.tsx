'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  getItemKey,
}: VirtualScrollProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = getItemKey ? getItemKey(item, virtualItem.index) : virtualItem.index;
          
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Virtual table component for ticket lists
interface VirtualTableProps<T> {
  items: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    render: (item: T, index: number) => React.ReactNode;
  }>;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
  onItemClick?: (item: T, index: number) => void;
}

export function VirtualTable<T>({
  items,
  columns,
  itemHeight = 60,
  containerHeight = 400,
  className,
  getItemKey,
  onItemClick,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn('border rounded-lg', className)}>
      {/* Table Header */}
      <div className="grid border-b bg-muted/50 font-medium text-sm">
        <div 
          className="grid gap-4 px-4 py-3"
          style={{
            gridTemplateColumns: columns.map(col => col.width || '1fr').join(' '),
          }}
        >
          {columns.map((column) => (
            <div key={column.key} className="font-medium">
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Table Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            const key = getItemKey ? getItemKey(item, virtualItem.index) : virtualItem.index;
            
            return (
              <div
                key={key}
                className={cn(
                  'grid gap-4 px-4 py-3 border-b hover:bg-muted/50 transition-colors',
                  onItemClick && 'cursor-pointer'
                )}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                  gridTemplateColumns: columns.map(col => col.width || '1fr').join(' '),
                }}
                onClick={() => onItemClick?.(item, virtualItem.index)}
              >
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center">
                    {column.render(item, virtualItem.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Virtual list component for comments
interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 80,
  containerHeight = 400,
  className,
  getItemKey,
  emptyMessage = 'No items to display',
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ height: containerHeight }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = getItemKey ? getItemKey(item, virtualItem.index) : virtualItem.index;
          
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook to determine if virtual scrolling should be used
export function useVirtualScrolling(itemCount: number, threshold = 100) {
  return useMemo(() => {
    return itemCount > threshold;
  }, [itemCount, threshold]);
}

// Performance monitoring for virtual scrolling
export function useVirtualScrollPerformance(
  itemCount: number,
  virtualizer: any
) {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
  });

  useMemo(() => {
    const startTime = performance.now();
    performanceRef.current.renderCount++;
    
    return () => {
      const endTime = performance.now();
      performanceRef.current.lastRenderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Virtual scroll render ${performanceRef.current.renderCount}: ${performanceRef.current.lastRenderTime.toFixed(2)}ms for ${itemCount} items`);
      }
    };
  }, [itemCount, virtualizer]);

  return performanceRef.current;
}