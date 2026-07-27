'use client';

import { useMemo } from 'react';
import { ClipboardCheck, TrendingUp, AlertCircle, CheckCircle, Clock, Award } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, DonutChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';
import { supplierEsgService } from '@/modules/supplier-esg/service.js';
import { supplierScorecardService } from '@/modules/supplier-scorecards/service.js';
import { supplierRiskService } from '@/modules/supplier-risk/service.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export default function SupplierEsgPage() {
  const { session } = useAuth();

  const { data: assessments, isLoading: aLoading, isError: aError, refetch: refetchA } = useQuery({
    queryKey: ['supplier-assessments', session?.organization.id],
    queryFn: () => supplierEsgService.listAssessments({ limit: '100' }).then((r) => r.assessments ?? r),
  });

  const { data: scorecards, isLoading: scLoading } = useQuery({
    queryKey: ['supplier-scorecards', session?.organization.id],
    queryFn: () => supplierScorecardService.listScorecards({ limit: '10' }).then((r) => r.scorecards ?? r),
  });

  const { data: riskHeatmap, isLoading: riskLoading } = useQuery({
    queryKey: ['supplier-risk-heatmap', session?.organization.id],
    queryFn: () => supplierRiskService.getRiskHeatmap(),
  });

  const categoryScores = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const a of assessments ?? []) {
      const cur = map.get(a.category) ?? { sum: 0, count: 0 };
      cur.sum += a.overallScore;
      cur.count += 1;
      map.set(a.category, cur);
    }
    return Array.from(map.entries()).map(([label, v]) => ({ label, value: v.count ? Math.round(v.sum / v.count) : 0 }));
  }, [assessments]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assessments ?? []) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [assessments]);

  const loading = aLoading || scLoading || riskLoading;

  if (aError) return <EmptyState title="Failed to load ESG data" message="Could not reach the supplier ESG API." onRetry={() => refetchA()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ClipboardCheck className="h-6 w-6 text-[rgb(var(--primary))]" />
          ESG Assessments
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Track supplier ESG performance across all assessment categories.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Assessments" value={assessments?.length ?? 0} />
          <StatTile label="Avg Score" value={`${assessments?.length ? Math.round(assessments.reduce((s, a) => s + a.overallScore, 0) / assessments.length) : 0}%`} />
          <StatTile label="Approved" value={assessments?.filter((a) => a.approvalStatus === 'approved').length ?? 0} />
          <StatTile label="High Risks" value={riskHeatmap?.highRisks?.length ?? 0} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Scores by Category</h2>
          {loading ? <Skeleton className="h-48" /> : categoryScores.length ? <BarChart data={categoryScores} /> : <EmptyState title="No category data" />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Assessment Status</h2>
          {loading ? <Skeleton className="h-48" /> : statusDistribution.length ? <DonutChart data={statusDistribution} /> : <EmptyState title="No status data" />}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent Assessments</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : assessments?.length === 0 ? (
          <EmptyState title="No assessments" description="Create assessments to evaluate supplier ESG performance." />
        ) : (
          <div className="space-y-2">
            {assessments?.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{a.category} · {a.supplierName ?? 'Unknown'}</p>
                </div>
                <span className="font-semibold">{a.overallScore}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}