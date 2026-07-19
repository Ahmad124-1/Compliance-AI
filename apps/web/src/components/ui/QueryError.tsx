'use client';

import { RotateCw, AlertTriangle } from 'lucide-react';

import { classifyError } from '@/lib/errors/classify.js';
import { Button } from '@/components/ui/button.js';
import { cn } from '@/lib/cn';

/**
 * Renders a friendly error panel for react-query errors with an optional retry.
 */
export function QueryError({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const classified = classifyError(error);
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-6 py-10 text-center', className)}>
      <div className="mb-3 text-red-500"><AlertTriangle className="h-8 w-8" /></div>
      <p className="text-sm font-medium text-[rgb(var(--text))]">{classified.title}</p>
      <p className="mt-1 max-w-sm text-xs text-[rgb(var(--muted))]">{classified.message}</p>
      {classified.retryable && onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw className="h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}
