'use client';

import { useMemo, useState } from 'react';
import { Download, ShieldAlert } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { EmptyState, QueryError } from '@/components/ui/index.js';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/hooks/useDebounced.js';
import { ACTION_LABELS } from '@/modules/audit/constants.js';
import { useAuditLogs, useAuditActions } from '@/modules/audit/hooks.js';
import type { AuditQueryFilters } from '@/modules/audit/types.js';

const PAGE_SIZE = 20;

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  critical: 'bg-red-500/15 text-red-600 dark:text-red-300',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const debouncedDateFrom = useDebouncedValue(dateFrom, 400);
  const debouncedDateTo = useDebouncedValue(dateTo, 400);

  const filters: AuditQueryFilters = useMemo(
    () => ({
      action: action || undefined,
      severity: severity || undefined,
      dateFrom: debouncedDateFrom || undefined,
      dateTo: debouncedDateTo || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [action, severity, debouncedDateFrom, debouncedDateTo, page],
  );

  const { data, isLoading, isError, error, refetch } = useAuditLogs(filters);
  const actions = useAuditActions();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const handleExport = () => {
    auditServiceExport(filters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Audit Trail</h1>
          <p className="text-xs text-[rgb(var(--muted))]">Immutable, timestamped record of every platform action.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[rgb(var(--muted))]">Action</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-2 text-sm outline-none"
          >
            <option value="">All actions</option>
            {(actions.data?.actions ?? []).map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a] ?? a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[rgb(var(--muted))]">Severity</label>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-2 text-sm outline-none"
          >
            <option value="">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[rgb(var(--muted))]">From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-2 text-sm outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[rgb(var(--muted))]">To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-2 text-sm outline-none" />
        </div>
      </Card>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <QueryError error={error} onRetry={() => refetch()} />}

      {!isLoading && !isError && data && data.logs.length === 0 && (
        <EmptyState icon={<ShieldAlert className="h-8 w-8" />} title="No audit entries" description="No events match the current filters." />
      )}

      {!isLoading && data && data.logs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-color))]">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[rgb(var(--panel-2))]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[rgb(var(--text))]">{ACTION_LABELS[log.action] ?? log.action}</p>
                      {log.description && <p className="text-xs text-[rgb(var(--muted))]">{log.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                      {log.actorType}
                      {log.actorId && <span className="block font-mono text-[10px]">{log.actorId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', SEVERITY_STYLES[log.severity] ?? SEVERITY_STYLES.info)}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                      {log.entity ?? '—'}
                      {log.entityId && <span className="block font-mono text-[10px]">{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">{formatTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && data.logs.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
          <span>
            Page {page + 1} of {totalPages} · {data.total} entries
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
  );
}

function auditServiceExport(filters: AuditQueryFilters) {
  void filters;
  window.location.href = `/api/v1/audit/export?limit=10000`;
}
