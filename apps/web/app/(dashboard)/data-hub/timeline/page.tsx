'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Upload, FileText, CheckCircle2, Settings2, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { dataHubService } from '@/modules/data-hub/service.js';
import type { DataHubActivityEntry } from '@/modules/data-hub/types.js';

const ACTION_ICONS: Record<string, typeof Activity> = {
  created: Upload,
  uploaded: Upload,
  imported: Upload,
  document_created: FileText,
  validated: CheckCircle2,
  approved: CheckCircle2,
  propagated: ArrowRightLeft,
  synchronized: ArrowRightLeft,
  settings_updated: Settings2,
};

export default function DataHubTimelinePage() {
  const activityQuery = useQuery({
    queryKey: ['data-hub', 'activity'],
    queryFn: () => dataHubService.getActivity(100),
  });

  const entries: DataHubActivityEntry[] = activityQuery.data ?? [];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Timeline</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Chronological record of every action in the Data Hub — imports, uploads, validations, approvals, propagation events and settings changes.
        </p>
      </div>

      {activityQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : activityQuery.isError ? (
        <ErrorState title="Failed to load activity timeline" onRetry={() => activityQuery.refetch()} />
      ) : entries.length ? (
        <div className="space-y-4">
          {entries.map((entry) => {
            const Icon = ACTION_ICONS[entry.action] ?? Activity;
            return (
              <Card key={entry.id} className="flex items-start gap-4 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--panel-2))]">
                  <Icon className="h-4 w-4 text-[rgb(var(--primary))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold capitalize">{entry.action.replace(/_/g, ' ')}</h3>
                    <span className="text-xs text-[rgb(var(--muted))]">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    {entry.entityName || entry.entityType ? `${entry.entityType?.replace(/_/g, ' ')}${entry.entityName ? ` — ${entry.entityName}` : ''}` : 'Data Hub event'}
                  </p>
                  {Object.keys(entry.details ?? {}).length ? (
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{JSON.stringify(entry.details)}</p>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-[rgb(var(--muted))]">No activity yet. Upload documents, create imports, or approve validation records and the timeline will populate automatically.</p>
        </Card>
      )}
    </div>
  );
}