'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldAlert, TrendingDown } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { BarChart, DonutChart, LineChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';

const http = createHttpClient(() => tokenStorage.getAccessToken());

interface CaseLike {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  riskScore: number;
  category: string;
  createdAt?: string;
}

function riskBand(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export default function RiskDashboardPage() {
  const { session } = useAuth();

  const { data: casesRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['risk-cases', session?.organization.id],
    queryFn: () => http<{ cases: CaseLike[]; total: number }>('/api/v1/cases'),
  });

  const { data: capas } = useQuery({
    queryKey: ['risk-capas'],
    queryFn: () => http<{ id: string; title: string; riskAssessment?: { residualRisk?: number } }[]>('/api/v1/capa'),
  });

  const cases = useMemo(() => casesRes?.cases ?? [], [casesRes]);

  const distribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    cases.forEach((c) => { counts[riskBand(c.riskScore)] += 1; });
    (capas ?? []).forEach((c) => { if (typeof c.riskAssessment?.residualRisk === 'number') counts[riskBand(c.riskAssessment.residualRisk)] += 1; });
    return [
      { label: 'High', value: counts.High, color: 'rgb(239 68 68)' },
      { label: 'Medium', value: counts.Medium, color: 'rgb(245 158 11)' },
      { label: 'Low', value: counts.Low, color: 'rgb(34 197 94)' },
    ];
  }, [cases, capas]);

  const avgCaseRisk = useMemo(() => {
    if (cases.length === 0) return 0;
    return Math.round(cases.reduce((s, c) => s + c.riskScore, 0) / cases.length);
  }, [cases]);

  const highRiskCount = distribution.find((d) => d.label === 'High')?.value ?? 0;
  const openHighRisk = useMemo(
    () => cases.filter((c) => riskBand(c.riskScore) === 'High' && !['resolved', 'closed', 'archived'].includes(c.status)).length,
    [cases],
  );

  const categoryRisk = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    cases.forEach((c) => {
      const cur = map.get(c.category) ?? { sum: 0, count: 0 };
      cur.sum += c.riskScore;
      cur.count += 1;
      map.set(c.category, cur);
    });
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, value: Math.round(v.sum / v.count) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [cases]);

  const trend = useMemo(() => {
    const byMonth = new Map<string, { sum: number; count: number }>();
    for (const c of cases) {
      if (!c.createdAt) continue;
      const month = new Date(c.createdAt).toISOString().slice(0, 7);
      const cur = byMonth.get(month) ?? { sum: 0, count: 0 };
      cur.sum += c.riskScore;
      cur.count += 1;
      byMonth.set(month, cur);
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({ label, value: Math.round(v.sum / Math.max(v.count, 1)) }));
  }, [cases]);

  const topRisks = useMemo(
    () => [...cases].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8),
    [cases],
  );

  if (isError) return <ErrorState title="Failed to load risk data" message="Could not reach the case risk API." onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldAlert className="h-6 w-6 text-[rgb(var(--primary))]" />
          Risk Dashboard
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Risk distribution, scores and top risk areas from cases and CAPAs.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Avg Case Risk" value={avgCaseRisk} hint="0–100 scale" />
          <StatTile label="High Risk Items" value={highRiskCount} hint="Cases + CAPAs" />
          <StatTile label="Open High Risk" value={openHighRisk} hint="Unresolved" />
          <StatTile label="Total Evaluated" value={cases.length + (capas?.length ?? 0)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Risk Distribution</h2>
          {isLoading ? <Skeleton className="h-48" /> : distribution.some((d) => d.value > 0) ? <DonutChart data={distribution} /> : <EmptyState title="No risk data" description="Risk scores are not available yet." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <TrendingDown className="h-4 w-4 text-[rgb(var(--primary))]" />
            Risk Trend (by category)
          </h2>
          {isLoading ? <Skeleton className="h-48" /> : categoryRisk.length ? <LineChart data={trend} /> : <EmptyState title="No trend data" description="Trend will appear once risk is evaluated." />}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Risk Score by Category</h2>
          {isLoading ? <Skeleton className="h-48" /> : categoryRisk.length ? <BarChart data={categoryRisk} /> : <EmptyState title="No categories" description="No risk-rated cases found." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Top Risk Areas
          </h2>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : topRisks.length === 0 ? (
            <EmptyState title="No risks identified" description="High-risk cases will be listed here." />
          ) : (
            <ul className="divide-y divide-[rgb(var(--border-color))]">
              {topRisks.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/cases/${c.id}`} className="truncate hover:underline">
                    <span className="font-medium">{c.caseNumber}</span>
                    <span className="ml-2 text-[rgb(var(--muted))]">{c.title}</span>
                  </Link>
                  <span className="ml-3 shrink-0 font-semibold" style={{ color: riskBand(c.riskScore) === 'High' ? 'rgb(239 68 68)' : riskBand(c.riskScore) === 'Medium' ? 'rgb(245 158 11)' : 'rgb(34 197 94)' }}>
                    {c.riskScore}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
