'use client';

import { useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface VColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: number;
}

interface VirtualizedTableProps<T> {
  columns: VColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  rowHeight?: number;
  height?: number;
  overscan?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

/**
 * Lightweight windowed table. Renders only the visible slice of rows plus an
 * overscan, keeping large lists (audit, search, notifications) performant
 * without a heavy virtualization dependency.
 */
export function VirtualizedTable<T>({
  columns,
  data,
  rowKey,
  rowHeight = 52,
  height = 520,
  overscan = 6,
  onRowClick,
  emptyMessage = 'No records found.',
  isLoading,
}: VirtualizedTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const total = data.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const endIndex = Math.min(total, startIndex + visibleCount);
  const slice = data.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted))]">
        Loading…
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted))]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))]">
      <div className="overflow-x-auto">
        <div style={{ minWidth: columns.reduce((w, c) => w + (c.width ?? 180), 0) }}>
          <div className="flex border-b border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
            {columns.map((c) => (
              <div key={c.key} className={cn('px-4 py-3 font-medium', c.className)} style={{ width: c.width ?? 180 }}>
                {c.header}
              </div>
            ))}
          </div>
          <div
            ref={scrollRef}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            style={{ height, overflowY: 'auto' }}
          >
            <div style={{ height: total * rowHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
                {slice.map((row) => (
                  <div
                    key={rowKey(row)}
                    className={cn(
                      'flex border-b border-[rgb(var(--border-color))] text-sm',
                      onRowClick && 'cursor-pointer hover:bg-[rgb(var(--panel-2))]',
                    )}
                    style={{ height: rowHeight }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((c) => (
                      <div key={c.key} className={cn('flex items-center px-4 text-[rgb(var(--text))]', c.className)} style={{ width: c.width ?? 180 }}>
                        {c.render(row)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
