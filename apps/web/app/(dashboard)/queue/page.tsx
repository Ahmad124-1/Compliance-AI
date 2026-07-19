'use client';

import { useState } from 'react';
import { RotateCcw, Ban, AlertTriangle, ArchiveRestore, Search } from 'lucide-react';

import { Button, DataTable, type Column, Drawer, StatTile, Skeleton } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { QUEUE_STATUS_LABELS, QUEUE_CHANNEL_GROUPS } from '@/modules/queue/constants.js';
import { useQueueJobs, useQueueStats, useRetryJob, useCancelJob, useDeadLetterJob, useProcessDeadLetter, useQueueUiStore } from '@/modules/queue/store.js';
import type { QueueJob } from '@/modules/queue/types.js';

function statusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]';
    case 'failed': return 'bg-[rgb(var(--danger)/0.15)] text-[rgb(var(--danger))]';
    case 'dead_letter': return 'bg-[rgb(var(--danger)/0.15)] text-[rgb(var(--danger))]';
    case 'processing': return 'bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]';
    default: return 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]';
  }
}

export default function QueueDashboard() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { search, statusFilter, queueFilter, setSearch, setStatusFilter, setQueueFilter } = useQueueUiStore();
  const canManage = hasPermission('queue:update');
  const { data: jobs, isLoading } = useQueueJobs(statusFilter ? { status: statusFilter } : queueFilter ? { queueName: queueFilter } : undefined);
  const { data: stats } = useQueueStats();
  const retry = useRetryJob();
  const cancel = useCancelJob();
  const deadLetter = useDeadLetterJob();
  const processDl = useProcessDeadLetter();
  const [selected, setSelected] = useState<QueueJob | null>(null);

  const filtered = (jobs ?? []).filter((j) => !search || j.jobType.toLowerCase().includes(search.toLowerCase()) || j.queueName.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase()));

  const act = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      toast({ title: label, variant: 'success' });
    } catch (e) {
      toast({ title: 'Action failed', description: String(e), variant: 'error' });
    }
  };

  const columns: Column<QueueJob>[] = [
    { key: 'queue', header: 'Queue', sortable: true, sortValue: (r) => r.queueName, render: (r) => <span className="font-medium">{r.queueName}</span> },
    { key: 'type', header: 'Job Type', sortable: true, sortValue: (r) => r.jobType, render: (r) => r.jobType },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(r.status)}`}>{QUEUE_STATUS_LABELS[r.status] ?? r.status}</span>,
    },
    { key: 'attempts', header: 'Attempts', sortable: true, sortValue: (r) => r.attempts, render: (r) => `${r.attempts}/${r.maxAttempts}` },
    {
      key: 'scheduled',
      header: 'Scheduled',
      sortable: true,
      sortValue: (r) => r.scheduledAt,
      render: (r) => new Date(r.scheduledAt).toLocaleString(),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {canManage && r.status === 'failed' && (
            <Button size="sm" variant="ghost" aria-label="Retry" onClick={() => act(() => retry.mutateAsync(r.id), 'Job retried')}><RotateCcw className="h-4 w-4" /></Button>
          )}
          {canManage && r.status === 'dead_letter' && (
            <Button size="sm" variant="ghost" aria-label="Requeue" onClick={() => act(() => processDl.mutateAsync(r.id), 'Requeued from dead letter')}><ArchiveRestore className="h-4 w-4" /></Button>
          )}
          {canManage && (r.status === 'pending' || r.status === 'queued' || r.status === 'processing') && (
            <Button size="sm" variant="ghost" aria-label="Cancel" onClick={() => act(() => cancel.mutateAsync(r.id), 'Job cancelled')}><Ban className="h-4 w-4" /></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Queue</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Monitor background jobs across notification, email, SMS and WhatsApp queues.</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => act(() => deadLetter.mutateAsync(selected?.id ?? ''), 'Sent to dead letter')} disabled={!selected}>
              <AlertTriangle className="h-4 w-4" /> Dead-letter
            </Button>
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total Jobs" value={stats?.total ?? '—'} />
        <StatTile label="Pending" value={stats?.byStatus?.pending ?? 0} />
        <StatTile label="Processing" value={stats?.byStatus?.processing ?? 0} />
        <StatTile label="Dead Letter" value={stats?.byStatus?.dead_letter ?? 0} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent pl-9 pr-3 text-sm" placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setQueueFilter(''); }}>
          <option value="">All statuses</option>
          {Object.entries(QUEUE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={queueFilter} onChange={(e) => { setQueueFilter(e.target.value); setStatusFilter(''); }}>
          <option value="">All queues</option>
          {QUEUE_CHANNEL_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.queueNames.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No jobs in the queue." rowKey={(r) => r.id} onRowClick={setSelected} />
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Job Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="ID" value={selected.id} />
            <Row label="Queue" value={selected.queueName} />
            <Row label="Type" value={selected.jobType} />
            <Row label="Status" value={QUEUE_STATUS_LABELS[selected.status] ?? selected.status} />
            <Row label="Attempts" value={`${selected.attempts}/${selected.maxAttempts}`} />
            <Row label="Priority" value={String(selected.priority)} />
            <Row label="Scheduled" value={new Date(selected.scheduledAt).toLocaleString()} />
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Payload</p>
              <pre className="mt-1 overflow-auto rounded-md bg-[rgb(var(--panel-2))] p-2 text-xs">{JSON.stringify(selected.payload, null, 2)}</pre>
            </div>
            {selected.lastError && (
              <div>
                <p className="text-xs text-[rgb(var(--danger))]">Last Error</p>
                <pre className="mt-1 overflow-auto rounded-md bg-[rgb(var(--danger)/0.1)] p-2 text-xs">{selected.lastError}</pre>
              </div>
            )}
            {canManage && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.status === 'failed' && <Button size="sm" variant="outline" onClick={() => act(() => retry.mutateAsync(selected.id), 'Job retried')}><RotateCcw className="h-4 w-4" /> Retry</Button>}
                {selected.status === 'dead_letter' && <Button size="sm" variant="outline" onClick={() => act(() => processDl.mutateAsync(selected.id), 'Requeued')}><ArchiveRestore className="h-4 w-4" /> Requeue</Button>}
                <Button size="sm" variant="outline" onClick={() => act(() => deadLetter.mutateAsync(selected.id), 'Dead-lettered')}><AlertTriangle className="h-4 w-4" /> Dead-letter</Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--border-color))] py-1 last:border-0">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
