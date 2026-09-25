'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Pencil, GitMerge, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/providers/ToastProvider';
import { dataHubService } from '@/modules/data-hub/service.js';
import type { ValidationQueueItem } from '@/modules/data-hub/types.js';

const ACTIONS = [
  { value: 'approved', label: 'Approve', icon: CheckCircle2, cls: 'text-green-700 border-green-200 hover:bg-green-50' },
  { value: 'rejected', label: 'Reject', icon: XCircle, cls: 'text-red-700 border-red-200 hover:bg-red-50' },
  { value: 'edited', label: 'Edit', icon: Pencil, cls: 'text-blue-700 border-blue-200 hover:bg-blue-50' },
  { value: 'merged', label: 'Merge', icon: GitMerge, cls: 'text-purple-700 border-purple-200 hover:bg-purple-50' },
  { value: 'ignored', label: 'Ignore', icon: EyeOff, cls: 'text-gray-600 border-gray-200 hover:bg-gray-50' },
] as const;

type ActionValue = (typeof ACTIONS)[number]['value'];

export default function DataHubValidationPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const queueQuery = useQuery({
    queryKey: ['data-hub', 'validation', filter],
    queryFn: () => dataHubService.getValidation(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: ActionValue; note?: string }) =>
      dataHubService.reviewValidation(id, action, note),
    onSuccess: () => {
      toast({ title: 'Record updated', description: 'Validation decision recorded. Approved records propagate to all modules.', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['data-hub'] });
    },
    onError: (err: Error) => toast({ title: 'Action failed', description: err.message, variant: 'error' }),
  });

  const items: ValidationQueueItem[] = queueQuery.data ?? [];
  const visibleItems = items.filter((item) => (filter === 'pending' ? item.status === 'pending' : item.status !== 'pending'));

  const renderDetail = (data: Record<string, unknown>) => {
    return Object.entries(data)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .slice(0, 8)
      .map(([k, v]) => (
        <div key={k} className="text-sm">
          <span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
          <span className="text-[rgb(var(--muted))]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
        </div>
      ));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Validation Queue</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Every imported record enters this queue. Actions: Approve, Reject, Edit, Merge, Ignore. Only approved records propagate to Compliance, Supplier, Sustainability, Carbon & GHG, ESG, dashboards, analytics and reports.
        </p>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setFilter('pending')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === 'pending' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>
          Pending
        </button>
        <button type="button" onClick={() => setFilter('reviewed')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === 'reviewed' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>
          Reviewed
        </button>
      </div>

      {queueQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : queueQuery.isError ? (
        <ErrorState title="Failed to load validation queue" onRetry={() => queueQuery.refetch()} />
      ) : visibleItems.length ? (
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{item.entityName || `Unnamed ${item.entityType.replace(/_/g, ' ')}`}</h3>
                    <span className="rounded bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">{item.entityType.replace(/_/g, ' ')}</span>
                    <span className={`rounded px-2 py-0.5 text-xs capitalize ${item.status === 'approved' ? 'bg-green-100 text-green-800' : item.status === 'rejected' ? 'bg-red-100 text-red-800' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span>
                  </div>
                  {item.validationErrors?.length ? (
                    <p className="mt-1 text-xs text-red-600">{item.validationErrors.length} validation error(s)</p>
                  ) : null}
                  <div className="mt-2 grid gap-1 md:grid-cols-2">{renderDetail(item.normalizedData ?? item.rawData)}</div>
                </div>
                {item.status === 'pending' && (
                  <div className="w-56 shrink-0 space-y-2">
                    <Textarea
                      placeholder="Review note (optional)"
                      rows={2}
                      value={notes[item.id] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {ACTIONS.filter((a) => a.value !== 'edited' && a.value !== 'merged').map((a) => (
                        <Button
                          key={a.value}
                          variant="outline"
                          size="sm"
                          className={a.cls}
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: item.id, action: a.value, note: notes[item.id] })}
                        >
                          <a.icon className="mr-1 h-3.5 w-3.5" />{a.label}
                        </Button>
                      ))}
                      {ACTIONS.filter((a) => a.value === 'edited' || a.value === 'merged').map((a) => (
                        <Button
                          key={a.value}
                          variant="outline"
                          size="sm"
                          className={a.cls}
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: item.id, action: a.value, note: notes[item.id] })}
                        >
                          <a.icon className="mr-1 h-3.5 w-3.5" />{a.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-[rgb(var(--muted))]">
            {filter === 'pending' ? 'No pending records. Imported records will appear here for approval before they propagate to modules.' : 'No reviewed records yet. Records you approve, reject, edit, merge or ignore will appear here.'}
          </p>
        </Card>
      )}
    </div>
  );
}