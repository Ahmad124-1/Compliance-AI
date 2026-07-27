'use client';

import { useMemo } from 'react';
import { Trophy, TrendingUp, BarChart3, Star, Target, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, LineChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { supplierScorecardService } from '@/modules/supplier-scorecards/service.js';
import { supplierService } from '@/modules/suppliers/service.js';

export default function SupplierScorecardsPage() {
  const { session } = useAuth();

  const { data: scorecards, isLoading: scLoading, refetch: refetchScorecards } = useQuery({
    queryKey: ['supplier-scorecards', session?.organization.id],
    queryFn: () => supplierScorecardService.listScorecards({ limit: '20' }).then((r) => r.scorecards ?? r),
  });

  const { data: benchmark, isLoading: bLoading } = useQuery({
    queryKey: ['scorecard-benchmark', session?.organization.id],
    queryFn: () => supplierScorecardService.getBenchmark(),
  });

  const { data: suppliers, isLoading: supLoading } = useQuery({
    queryKey: ['suppliers', session?.organization.id],
    queryFn: () => supplierService.listSuppliers({ limit: '100' }).then((r) => r.suppliers ?? r),
  });

  const trendData = useMemo(() => {
    if (!scorecards?.length) return [];
    return scorecards.slice(0, 10).map((s) => ({
      label: s.assessmentPeriod ?? s.scoringDate ?? 'N/A',
      value: s.overallEsgScore,
    }));
  }, [scorecards]);

  const dimensionData = useMemo(() => {
    if (!scorecards?.length) return [];
    const dims = ['overallEsgScore', 'environmentalScore', 'socialScore', 'governanceScore', 'complianceScore', 'carbonScore', 'riskScore'] as const;
    return dims.map((dim) => ({
      label: dim.replace(/([A-Z])/g, ' $1').trim(),
      value: Math.round(scorecards.reduce((s, sc) => s + (sc as any)[dim], 0) / scorecards.length),
    }));
  }, [scorecards]);

  const loading = scLoading || bLoading || supLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Trophy className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Scorecards
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Benchmark, trend analysis, and historical ESG performance for suppliers.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Scorecards" value={scorecards?.length ?? 0} />
          <StatTile label="Avg ESG Score" value={`${scorecards?.length ? Math.round(scorecards.reduce((s, sc) => s + sc.overallEsgScore, 0) / scorecards.length) : 0}%`} />
          <StatTile label="Avg Carbon" value={`${scorecards?.length ? Math.round(scorecards.reduce((s, sc) => s + sc.carbonScore, 0) / scorecards.length) : 0}%`} />
          <StatTile label="Avg Risk" value={`${scorecards?.length ? Math.round(scorecards.reduce((s, sc) => s + sc.riskScore, 0) / scorecards.length) : 0}%`} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Scorecard Trends</h2>
          {loading ? <Skeleton className="h-48" /> : trendData.length ? <LineChart data={trendData} /> : <EmptyState title="No trend data" />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Dimension Averages</h2>
          {loading ? <Skeleton className="h-48" /> : dimensionData.length ? <BarChart data={dimensionData} /> : <EmptyState title="No dimension data" />}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Benchmark Comparison</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : benchmark?.length ? (
          <div className="space-y-2">
            {benchmark.slice(0, 10).map((b, i) => (
              <div key={b.supplierId} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <span>#{b.rank} {b.supplierName ?? 'Unknown'}</span>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{b.overallEsgScore}%</span>
                  <span className="text-xs text-[rgb(var(--muted))]">P{b.percentile}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No benchmark data" />
        )}
      </Card>
    </div>
  );
}