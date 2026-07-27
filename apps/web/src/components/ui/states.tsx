'use client';

import { AlertTriangle, Inbox, SearchX, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Button } from './button.js';

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
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-6 py-16 text-center', className)}>
      <div className="mb-4 text-[rgb(var(--muted-2))]">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <p className="text-base font-medium text-[rgb(var(--text))]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[rgb(var(--muted))]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
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
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-6 py-16 text-center', className)}>
      <div className="mb-4 text-[rgb(var(--danger))]"><AlertTriangle className="h-10 w-10" /></div>
      <p className="text-base font-medium text-[rgb(var(--text))]">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-[rgb(var(--muted))]">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-10 w-10" />}
      title="No results found"
      description={query ? `We couldn't find anything matching "${query}".` : 'Try a different search term or scope.'}
    />
  );
}
