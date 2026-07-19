'use client';

import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { SkeletonTable } from './Skeleton.js';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  rowKey,
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const sorted = [...(data ?? [])];
  const activeCol = columns.find((c) => c.key === sortKey && c.sortable);
  if (activeCol?.sortValue) {
    sorted.sort((a, b) => {
      const av = activeCol.sortValue!(a);
      const bv = activeCol.sortValue!(b);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (isLoading) return <SkeletonTable />;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-8 text-center text-sm text-[rgb(var(--muted))]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn('px-4 py-3 font-medium', c.className)}
                  aria-sort={c.sortable && sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-[rgb(var(--text))]"
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.header}
                      <span className="text-[rgb(var(--muted-2))]">{sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border-color))]">
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-[rgb(var(--panel-2))]')}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 text-[rgb(var(--text))]', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-[rgb(var(--border-color))] px-4 py-2 text-xs text-[rgb(var(--muted))]">
          <span>
            Page {current + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-[rgb(var(--border-color))] px-2 py-1 disabled:opacity-50"
              disabled={current === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded border border-[rgb(var(--border-color))] px-2 py-1 disabled:opacity-50"
              disabled={current >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
