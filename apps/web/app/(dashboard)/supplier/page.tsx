'use client';

import { useMemo } from 'react';
import { Truck, PackageCheck, AlertCircle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { BarChart, DonutChart, LineChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';

const http = createHttpClient(() => tokenStorage.getAccessToken());

interface SupplierAssessment {
  id: string;
  title: string;
  supplierId: string;
  supplierName: string;
  category: string;
  score: number;
  status: string;
  createdAt: string;
}
interface NonConformity {
  id: string;
  title: string;
  supplierId: string;
  severity: string;
  status: string;
}

function _qp(_params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(_params)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `?${q}` : '';
}

export default function SupplierDashboardPage() {
  const { session } = useAuth();

  const { data: assessments, isLoading: aLoading, isError: aError, refetch: refetchA } = useQuery({
    queryKey: ['supplier-assessments', session?.organization.id],
    queryFn: () =>
      http<SupplierAssessment[]>('/api/v1/assessments').then((raw: any) => {
        const list: any[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        return list
          .filter((a) => a.type === 'supplier' || a.metadata?.supplierId || a.supplierId)
          .map((a) => ({
            id: a.id,
            title: a.title,
            supplierId: a.supplierId ?? (a.metadata?.supplierId as string) ?? 'unknown',
            supplierName: a.supplierName ?? (a.metadata?.supplierName as string) ?? 'Unknown supplier',
            category: (a.metadata?.category as string) ?? a.category ?? 'General',
            score: typeof a.scoringSummary?.overallScore === 'number' ? a.scoringSummary.overallScore : (a.progress ?? 0),
            status: a.status,
            createdAt: a.createdAt,
          }));
      }),
  });

  const { data: nonConformities, isLoading: ncLoading } = useQuery({
    queryKey: ['supplier-nonconformities'],
    queryFn: () => http<NonConformity[]>('/api/v1/capa/non-conformities'),
  });

  const supplierStats = useMemo(() => {
    const map = new Map<string, { name: string; sum: number; count: number; nonConf: number }>();
    for (const a of assessments ?? []) {
      const cur = map.get(a.supplierId) ?? { name: a.supplierName, sum: 0, count: 0, nonConf: 0 };
      cur.sum += a.score;
      cur.count += 1;
      map.set(a.supplierId, cur);
    }
    for (const nc of nonConformities ?? []) {
      if (!nc.supplierId || nc.supplierId === 'unknown') continue;
      const cur = map.get(nc.supplierId) ?? { name: 'Unknown supplier', sum: 0, count: 0, nonConf: 0 };
      cur.nonConf += 1;
      map.set(nc.supplierId, cur);
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      avgScore: v.count ? Math.round(v.sum / v.count) : 0,
      assessed: v.count,
      nonConformities: v.nonConf,
    }));
  }, [assessments, nonConformities]);

  const totalAssessed = supplierStats.reduce((s, x) => s + x.assessed, 0);
  const avgSupplierScore = supplierStats.length
    ? Math.round(supplierStats.reduce((s, x) => s + x.avgScore * x.assessed, 0) / Math.max(totalAssessed, 1))
    : 0;

  const categoryScores = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const a of assessments ?? []) {
      const cur = map.get(a.category) ?? { sum: 0, count: 0 };
      cur.sum += a.score;
      cur.count += 1;
      map.set(a.category, cur);
    }
    return Array.from(map.entries()).map(([label, v]) => ({ label, value: v.count ? Math.round(v.sum / v.count) : 0 }));
  }, [assessments]);

  const complianceTrend = useMemo(() => {
    return (assessments ?? [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((a) => ({ label: new Date(a.createdAt).toLocaleDateString(), value: a.score }));
  }, [assessments]);

  const ncBySeverity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const nc of nonConformities ?? []) {
      const key = (nc.severity ?? 'low').toLowerCase() as keyof typeof counts;
      if (key in counts) counts[key] += 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [nonConformities]);

  const loading = aLoading || ncLoading;
  const isError = aError;

  if (isError) return <ErrorState title="Failed to load supplier data" message="Could not reach the supplier API." onRetry={() => refetchA()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Truck className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Dashboard
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Supplier assessment performance, categories and non-conformities.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Suppliers" value={supplierStats.length} />
          <StatTile label="Assessments" value={totalAssessed} />
          <StatTile label="Avg Score" value={`${avgSupplierScore}%`} />
          <StatTile label="Non-Conformities" value={nonConformities?.length ?? 0} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Supplier Categories & Scores</h2>
          {loading ? <Skeleton className="h-48" /> : categoryScores.length ? <BarChart data={categoryScores} /> : <EmptyState title="No category data" description="No supplier assessment scores found." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <PackageCheck className="h-4 w-4 text-[rgb(var(--primary))]" />
            Compliance Trend
          </h2>
          {loading ? <Skeleton className="h-48" /> : complianceTrend.length ? <LineChart data={complianceTrend} /> : <EmptyState title="No trend data" description="Trend will appear as assessments are completed." />}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Supplier Scores</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : supplierStats.length === 0 ? (
            <EmptyState title="No suppliers assessed" description="Supplier assessments will appear here." />
          ) : (
            <div className="space-y-2">
              {supplierStats
                .sort((a, b) => a.avgScore - b.avgScore)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{s.assessed} assessed · {s.nonConformities} non-conformities</p>
                    </div>
                    <span className="font-semibold">{s.avgScore}%</span>
                  </div>
                ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Non-Conformities by Severity
          </h2>
          {loading ? <Skeleton className="h-48" /> : ncBySeverity.some((d) => d.value > 0) ? <DonutChart data={ncBySeverity} /> : <EmptyState title="No non-conformities" description="No supplier non-conformities recorded." />}
        </Card>
      </div>
    </div>
  );
}
