import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[rgb(var(--panel-2))]', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-5 shadow-[var(--shadow-sm)]">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="space-y-3 rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-5">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
