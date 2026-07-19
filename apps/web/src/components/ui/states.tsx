'use client';

import { AlertTriangle, Inbox, SearchX } from 'lucide-react';

import { cn } from '@/lib/cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-6 py-12 text-center', className)}>
      <div className="mb-3 text-[rgb(var(--muted-2))]">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <p className="text-sm font-medium text-[rgb(var(--text))]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-[rgb(var(--muted))]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-6 py-12 text-center', className)}>
      <div className="mb-3 text-red-500"><AlertTriangle className="h-8 w-8" /></div>
      <p className="text-sm font-medium text-[rgb(var(--text))]">{title}</p>
      {message && <p className="mt-1 max-w-sm text-xs text-[rgb(var(--muted))]">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-[rgb(var(--border-color))] px-3 py-1.5 text-xs hover:bg-[rgb(var(--panel-2))]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-8 w-8" />}
      title="No results found"
      description={query ? `We couldn't find anything matching "${query}".` : 'Try a different search term or scope.'}
    />
  );
}
