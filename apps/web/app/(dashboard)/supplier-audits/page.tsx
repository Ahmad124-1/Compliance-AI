'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { supplierAuditService } from '@/modules/supplier-audits/service.js';

export default function SupplierAuditsPage() {
  const { session } = useAuth();

  const { data: audits, isLoading: aLoading, refetch: refetchAudits } = useQuery({
    queryKey: ['supplier-audits', session?.organization.id],
    queryFn: () => supplierAuditService.listAudits({ limit: '100' }).then((r) => r.audits ?? r),
  });

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of audits ?? []) {
      map.set(a.auditType, (map.get(a.auditType) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [audits]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of audits ?? []) {
      map.set(a.status, (map.get(a.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [audits]);

  const loading = aLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <FileText className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Audits
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Track audit schedules, findings, evidence, and approvals.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Audits" value={audits?.length ?? 0} />
          <StatTile label="In Progress" value={audits?.filter((a) => a.status === 'in_progress').length ?? 0} />
          <StatTile label="Completed" value={audits?.filter((a) => a.status === 'completed').length ?? 0} />
          <StatTile label="Follow-Up Required" value={audits?.filter((a) => a.status === 'follow_up_required').length ?? 0} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Audit Types</h2>
          {loading ? <Skeleton className="h-48" /> : byType.length ? <BarChart data={byType} /> : <EmptyState title="No type data" />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Audit Status</h2>
          {loading ? <Skeleton className="h-48" /> : byStatus.length ? <BarChart data={byStatus} /> : <EmptyState title="No status data" />}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent Audits</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : audits?.length === 0 ? (
          <EmptyState title="No audits" description="Create audits to evaluate supplier compliance." />
        ) : (
          <div className="space-y-2">
            {audits?.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{a.auditType} · {a.status}</p>
                </div>
                <span className="font-semibold">{a.findingCount} findings</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}