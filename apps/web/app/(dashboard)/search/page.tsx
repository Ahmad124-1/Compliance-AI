'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bookmark, Clock, Star, X, Save, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/states.js';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/hooks/useDebounced.js';
import {
  useGlobalSearch,
  useSavedSearches,
  useRecentSearches,
  useSaveSearch,
  useDeleteSavedSearch,
  useClearRecentSearches,
  SCOPE_OPTIONS,
  SCOPE_LABELS,
  SCOPE_COLORS,
  type SearchScope,
  type SearchHit,
} from '@/modules/search';

const PAGE_SIZE = 15;

function HitRow({ hit, onOpen }: { hit: SearchHit; onOpen: (url: string) => void }) {
  const color = SCOPE_COLORS[hit.scope] ?? 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]';
  return (
    <button
      type="button"
      onClick={() => onOpen(hit.url)}
      className="flex w-full items-start gap-3 rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-4 text-left transition-colors hover:bg-[rgb(var(--panel-2))]"
    >
      <span className={cn('mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', color)}>
        {SCOPE_LABELS[hit.scope] ?? hit.scope}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[rgb(var(--text))]">{hit.title}</p>
        {hit.subtitle && <p className="truncate text-xs text-[rgb(var(--muted))]">{hit.subtitle}</p>}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {hit.status && <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[10px] text-[rgb(var(--muted))]">{hit.status}</span>}
          {hit.priority && <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[10px] text-[rgb(var(--muted))]">{hit.priority}</span>}
          {hit.category && <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[10px] text-[rgb(var(--muted))]">{hit.category}</span>}
        </div>
      </div>
    </button>
  );
}

export default function GlobalSearchPage() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [saveName, setSaveName] = useState('');

  const debouncedTerm = useDebouncedValue(term, 300);

  const params = useMemo(
    () => (debouncedTerm.trim() ? { term: debouncedTerm, scope, limit: PAGE_SIZE, offset: page * PAGE_SIZE } : null),
    [debouncedTerm, scope, page],
  );

  const query = useGlobalSearch(params);
  const saved = useSavedSearches();
  const recent = useRecentSearches();
  const saveMutation = useSaveSearch();
  const deleteSaved = useDeleteSavedSearch();
  const clearRecent = useClearRecentSearches();

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1;

  const onOpen = (url: string) => router.push(url);

  const handleSave = () => {
    const name = saveName.trim() || debouncedTerm.trim() || 'Untitled search';
    saveMutation.mutate({ name, scope, query: debouncedTerm });
    setSaveName('');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Global Search</h1>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search complaints, cases, tracking numbers, factories…"
            aria-label="Global search"
            className="h-11 w-full rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SCOPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setScope(o.value as SearchScope);
                setPage(0);
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs',
                scope === o.value
                  ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                  : 'border border-[rgb(var(--border-color))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-2))]',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <Card className="flex flex-wrap items-end gap-3 p-4">
            <div className="flex flex-1 items-center gap-2">
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Name this search to save it"
                className="h-9 flex-1 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm outline-none"
              />
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {query.isLoading && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </>
          )}

          {query.isError && <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />}

          {!query.isLoading && !query.isError && params && query.data && query.data.total === 0 && <NoResults query={debouncedTerm} />}

          {!params && !query.isLoading && (
            <EmptyState title="Start searching" description="Type a term above or pick a scope to search across the platform." />
          )}

          {query.data && query.data.hits.map((hit) => (
            <HitRow key={`${hit.scope}-${hit.id}`} hit={hit} onOpen={onOpen} />
          ))}
        </div>

        {query.data && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[rgb(var(--border-color))] pt-3 text-xs text-[rgb(var(--muted))]">
            <span>
              Page {page + 1} of {totalPages} · {query.data.total} results
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            <Star className="h-3.5 w-3.5" /> Saved searches
          </div>
          {saved.isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : saved.data && saved.data.length ? (
            <ul className="space-y-1">
              {saved.data.map((s) => (
                <li key={s.id} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-[rgb(var(--panel-2))]">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => { setTerm(s.query); setScope(s.scope as SearchScope); setPage(0); }}>
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--muted))]" />
                    <span className="truncate text-sm">{s.name}</span>
                  </button>
                  <button type="button" className="opacity-0 group-hover:opacity-100" onClick={() => deleteSaved.mutate(s.id)} aria-label="Delete saved search">
                    <X className="h-3.5 w-3.5 text-[rgb(var(--muted))]" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">No saved searches yet.</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <Clock className="h-3.5 w-3.5" /> Recent
            </div>
            {recent.data && recent.data.length > 0 && (
              <button type="button" className="text-[10px] text-[rgb(var(--muted))]" onClick={() => clearRecent.mutate()}>
                Clear
              </button>
            )}
          </div>
          {recent.isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : recent.data && recent.data.length ? (
            <ul className="space-y-1">
              {recent.data.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[rgb(var(--panel-2))]"
                    onClick={() => { setTerm(r.query); setScope(r.scope as SearchScope); setPage(0); }}
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--muted))]" />
                    <span className="truncate text-sm">{r.query}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">No recent searches.</p>
          )}
        </Card>
      </aside>
    </div>
  );
}
