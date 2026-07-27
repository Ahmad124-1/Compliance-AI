'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Shield, Activity, TrendingDown } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, DonutChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { supplierRiskService } from '@/modules/supplier-risk/service.js';

export default function SupplierRiskPage() {
  const { session } = useAuth();

  const { data: risks, isLoading: rLoading, refetch: refetchRisks } = useQuery({
    queryKey: ['supplier-risks', session?.organization.id],
    queryFn: () => supplierRiskService.listRisks({ limit: '100' }).then((r) => r.risks ?? r),
  });

  const { data: heatmap, isLoading: hLoading } = useQuery({
    queryKey: ['risk-heatmap', session?.organization.id],
    queryFn: () => supplierRiskService.getRiskHeatmap(),
  });

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of risks ?? []) {
      map.set(r.riskType, (map.get(r.riskType) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [risks]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of risks ?? []) {
      map.set(r.status, (map.get(r.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [risks]);

  const loading = rLoading || hLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <AlertTriangle className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Risk Management
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Monitor and mitigate supplier risks across all categories.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Risks" value={risks?.length ?? 0} />
          <StatTile label="Open Risks" value={risks?.filter((r) => r.status === 'open').length ?? 0} />
          <StatTile label="High Risks" value={heatmap?.highRisks?.length ?? 0} />
          <StatTile label="Avg Risk Score" value={risks?.length ? Math.round(risks.reduce((s, r) => s + r.riskScore, 0) / risks.length) : 0} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Risks by Type</h2>
          {loading ? <Skeleton className="h-48" /> : byType.length ? <BarChart data={byType} /> : <EmptyState title="No risk data" />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Risks by Status</h2>
          {loading ? <Skeleton className="h-48" /> : byStatus.length ? <DonutChart data={byStatus} /> : <EmptyState title="No status data" />}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Active Risks</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : risks?.length === 0 ? (
          <EmptyState title="No risks" description="No supplier risks have been identified." />
        ) : (
          <div className="space-y-2">
            {risks?.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{r.riskType} · L:{r.likelihood} I:{r.impact}</p>
                </div>
                <span className={`font-semibold ${r.riskScore >= 12 ? 'text-red-500' : r.riskScore >= 6 ? 'text-yellow-500' : 'text-green-500'}`}>{r.riskScore}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}