'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Play, RotateCcw, Activity, CheckCircle2, AlertTriangle, XCircle, SkipForward } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { dataHubService } from '@/modules/data-hub/service.js';
import type { SyncEngineEntityType, SyncActivityLogEntry } from '@/modules/data-hub/types.js';

const ENTITY_LABELS: Record<string, string> = {
  facility: 'Facilities',
  supplier: 'Suppliers',
  project: 'Projects',
  kpi: 'KPIs',
  carbon_record: 'Carbon Records',
  document: 'Documents',
  all: 'All Modules',
};

type LogStatus = SyncActivityLogEntry['status'];

const STATUS_STYLES: Record<LogStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  success: { label: 'Success', className: 'text-emerald-600', icon: CheckCircle2 },
  error: { label: 'Error', className: 'text-red-600', icon: XCircle },
  skipped: { label: 'Skipped', className: 'text-gray-500', icon: SkipForward },
  conflict: { label: 'Conflict', className: 'text-orange-600', icon: AlertTriangle },
};

export default function DataHubSyncEnginePage() {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState<SyncEngineEntityType>('all');

  const statusQuery = useQuery({
    queryKey: ['data-hub', 'sync-engine', 'status'],
    queryFn: () => dataHubService.syncEngineStatus(),
  });

  const logsQuery = useQuery({
    queryKey: ['data-hub', 'sync-engine', 'logs'],
    queryFn: () => dataHubService.syncLogs(100),
  });

  const runMutation = useMutation({
    mutationFn: () => dataHubService.syncRun({ entityType: selectedEntity, jobType: 'manual' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-hub', 'sync-engine'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => dataHubService.syncRetry(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-hub', 'sync-engine'] });
    },
  });

  const statuses = statusQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Synchronization Engine</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            One connected platform — information entered once is automatically synchronized across
            Administration, Compliance, Supplier, Sustainability, Carbon & GHG and ESG modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value as SyncEngineEntityType)}
            className="rounded-md border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
          >
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
          >
            <Play className="mr-1 h-4 w-4" />
            {runMutation.isPending ? 'Running…' : 'Run Sync'}
          </Button>
        </div>
      </div>

      {runMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Sync run failed: {(runMutation.error as Error).message}
        </div>
      )}

      {statusQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : statusQuery.isError ? (
        <ErrorState title="Failed to load sync status" onRetry={() => statusQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {statuses.map((s) => {
            const label = ENTITY_LABELS[s.entity_type] ?? s.entity_type_label ?? s.entity_type;
            return (
              <Card key={s.entity_type} className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <Activity className="h-4 w-4 text-[rgb(var(--muted))]" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{s.total_records}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {s.last_synced_at
                    ? `Last synced ${new Date(s.last_synced_at).toLocaleString()}`
                    : 'Never synced'}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Mode: {s.sync_mode ?? '—'}
                  {s.synced_by ? ` · by ${s.synced_by}` : ''}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Activity Log</h2>
          <Button variant="outline" size="sm" onClick={() => logsQuery.refetch()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </div>

        {logsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : logsQuery.isError ? (
          <ErrorState title="Failed to load sync logs" onRetry={() => logsQuery.refetch()} />
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">
            No synchronization activity yet. Run a sync to see logs here.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const st = STATUS_STYLES[log.status] ?? STATUS_STYLES.skipped;
              const Icon = st.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 rounded-md border border-[rgb(var(--border))] p-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${st.className}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{log.action}</span>
                      {log.entityName && (
                        <span className="text-xs text-[rgb(var(--muted))]">— {log.entityName}</span>
                      )}
                      <span className={`text-xs font-medium ${st.className}`}>{st.label}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[rgb(var(--muted))]">
                      {log.entityType && <span>Entity: {log.entityType}</span>}
                      {log.sourceModule && <span>Source: {log.sourceModule}</span>}
                      {log.targetModule && <span>Target: {log.targetModule}</span>}
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.status === 'error' && (
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryMutation.mutate(log.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" /> Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}