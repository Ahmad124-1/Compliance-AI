'use client';

import { useState, useMemo, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { SkeletonTable } from './Skeleton.js';
import { Button } from './button.js';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (row: T) => string[];
  onExport?: () => void;
  bulkActions?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  rowKey,
  onRowClick,
  pageSize = 10,
  searchable = false,
  searchKeys,
  onExport,
  bulkActions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...(data ?? [])];
    if (search && searchKeys) {
      const q = search.toLowerCase();
      result = result.filter((row) => searchKeys(row).some((k) => k.toLowerCase().includes(q)));
    }
    return result;
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    const result = [...filtered];
    const activeCol = columns.find((c) => c.key === sortKey && c.sortable);
    if (activeCol?.sortValue) {
      result.sort((a, b) => {
        const av = activeCol.sortValue!(a);
        const bv = activeCol.sortValue!(b);
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [filtered, sortKey, sortDir, columns]);

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

  if (isLoading) return <SkeletonTable rows={pageSize} />;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-8 text-center text-sm text-[rgb(var(--muted))]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(searchable || onExport || bulkActions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchable && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="h-9 w-64 rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 py-1.5 text-sm placeholder:text-[rgb(var(--muted-2))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {bulkActions}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                Export
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn('px-4 py-3 font-medium', c.className)}
                    style={c.width ? { width: c.width } : undefined}
                    aria-sort={c.sortable && sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-[rgb(var(--text))] transition-colors"
                        onClick={() => toggleSort(c.key)}
                      >
                        {c.header}
                        <span className="text-[rgb(var(--muted-2))]">
                          {sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
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
                  className={cn('transition-colors duration-150', onRowClick && 'cursor-pointer hover:bg-[rgb(var(--panel-2))]')}
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
          <div className="flex items-center justify-between border-t border-[rgb(var(--border-color))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
            <span>
              Showing {current * pageSize + 1}-{Math.min((current + 1) * pageSize, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-[rgb(var(--border-color))] px-3 py-1.5 transition-colors hover:bg-[rgb(var(--panel-2))] disabled:opacity-50"
                disabled={current === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="tabular-nums">
                {current + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="rounded-lg border border-[rgb(var(--border-color))] px-3 py-1.5 transition-colors hover:bg-[rgb(var(--panel-2))] disabled:opacity-50"
                disabled={current >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
