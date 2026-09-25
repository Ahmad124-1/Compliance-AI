'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { dataHubService } from '@/modules/data-hub/service.js';
import type { ValidationQueueItem } from '@/modules/data-hub/types.js';

const STATUS_META: Record<string, { icon: typeof Clock; cls: string }> = {
  queued: { icon: Clock, cls: 'bg-yellow-100 text-yellow-800' },
  running: { icon: Loader2, cls: 'bg-blue-100 text-blue-800' },
  completed: { icon: CheckCircle2, cls: 'bg-green-100 text-green-800' },
  failed: { icon: XCircle, cls: 'bg-red-100 text-red-800' },
  retry: { icon: RotateCcw, cls: 'bg-purple-100 text-purple-800' },
  cancelled: { icon: XCircle, cls: 'bg-gray-100 text-gray-700' },
};

export default function DataHubQueuePage() {
  const queueQuery = useQuery({
    queryKey: ['data-hub', 'queue'],
    queryFn: () => dataHubService.getQueue(),
  });

  const pendingItems: ValidationQueueItem[] = queueQuery.data?.pending ?? [];
  const processingItems: ValidationQueueItem[] = queueQuery.data?.processing ?? [];
  const counts = queueQuery.data?.counts ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Processing Queue</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Backend infrastructure for AI processing. Statuses: Queued, Running, Completed, Failed, Retry, Cancelled. OCR and LLM extraction are prepared as extension points — no extraction runs yet.
        </p>
      </div>

      {queueQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : queueQuery.isError ? (
        <ErrorState title="Failed to load processing queue" onRetry={() => queueQuery.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {counts.map((c) => {
              const meta = STATUS_META[c.status] ?? { icon: Clock, cls: 'bg-gray-100 text-gray-700' };
              const Icon = meta.icon;
              return (
                <Card key={c.status} className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 rounded-full p-0.5 ${meta.cls}`} />
                    <span className="text-sm capitalize">{c.status}</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{c.count}</p>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Pending Validation ({pendingItems.length})</h2>
              {pendingItems.length ? (
                <div className="space-y-2">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-2 text-sm">
                      <span className="font-medium">{item.entityName || item.entityType.replace(/_/g, ' ')}</span>
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs capitalize text-yellow-800">{item.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">No records pending validation.</p>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">In Processing ({processingItems.length})</h2>
              {processingItems.length ? (
                <div className="space-y-2">
                  {processingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-2 text-sm">
                      <span className="font-medium">{item.entityName || item.entityType.replace(/_/g, ' ')}</span>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs capitalize text-blue-800">{item.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">No records in processing. AI extraction infrastructure is ready; OCR and LLM are future extensions.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}