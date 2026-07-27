'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { BarChart, DonutChart, LineChart } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';

const http = createHttpClient(() => tokenStorage.getAccessToken());

interface StandardScore {
  standard: string;
  score: number;
  assessed: number;
}
interface ComplianceStatus {
  compliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  notAssessed: number;
}
interface ScoreTrendPoint {
  period: string;
  score: number;
}

function colorForScore(score: number): string {
  if (score >= 80) return 'rgb(34 197 94)';
  if (score >= 60) return 'rgb(245 158 11)';
  return 'rgb(239 68 68)';
}

export default function ComplianceScoreDashboardPage() {
  const { session } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['compliance-score', session?.organization.id],
    queryFn: async () => {
      const [assessments, statuses] = await Promise.all([
        http<{ data: AssessmentLike[]; total: number }>('/api/v1/assessments'),
        http<ComplianceStatus | null>('/api/v1/compliance/status').catch(() => null),
      ]);
      return { assessments, statuses };
    },
  });

  const standards = useMemo<StandardScore[]>(() => {
    if (!data?.assessments?.data) return [];
    const map = new Map<string, { sum: number; count: number }>();
    for (const a of data.assessments.data) {
      const score = typeof a.scoringSummary?.overallScore === 'number' ? (a.scoringSummary.overallScore as number) : (a.progress ?? 0);
      const std = (a.metadata?.standard as string) ?? a.type ?? 'Uncategorized';
      const cur = map.get(std) ?? { sum: 0, count: 0 };
      cur.sum += score;
      cur.count += 1;
      map.set(std, cur);
    }
    return Array.from(map.entries())
      .map(([standard, v]) => ({ standard, score: Math.round(v.sum / v.count), assessed: v.count }))
      .sort((a, b) => b.score - a.score);
  }, [data]);

  const overall = useMemo(() => {
    if (standards.length === 0) return null;
    const sum = standards.reduce((s, x) => s + x.score * x.assessed, 0);
    const total = standards.reduce((s, x) => s + x.assessed, 0);
    return total ? Math.round(sum / total) : null;
  }, [standards]);

  const complianceDonut = useMemo(() => {
    const s = data?.statuses;
    if (!s) return [];
    return [
      { label: 'Compliant', value: s.compliant },
      { label: 'Partial', value: s.partiallyCompliant },
      { label: 'Non-compliant', value: s.nonCompliant },
      { label: 'Not Assessed', value: s.notAssessed },
    ];
  }, [data]);

  const trend = useMemo<ScoreTrendPoint[]>(() => {
    return standards
      .slice(0, 6)
      .map((s) => ({ period: s.standard, score: s.score }));
  }, [standards]);

  const drill = selected ? standards.find((s) => s.standard === selected) : null;

  if (isError) return <ErrorState title="Failed to load compliance data" message="Could not reach the compliance API." onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-6 w-6 text-[rgb(var(--primary))]" />
          Compliance Score
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Overall compliance posture across standards and frameworks.</p>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center p-6">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Overall Compliance</p>
            <p className="mt-2 text-5xl font-bold" style={{ color: overall ? colorForScore(overall) : 'rgb(var(--text))' }}>
              {overall ?? '—'}
              {overall !== null && <span className="text-2xl">%</span>}
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              {standards.reduce((s, x) => s + x.assessed, 0)} assessments evaluated
            </p>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Compliance Status</h2>
            {complianceDonut.length && complianceDonut.some((d) => d.value > 0) ? (
              <DonutChart data={complianceDonut} />
            ) : (
              <EmptyState title="No status breakdown" description="Compliance status data is not available." />
            )}
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-[rgb(var(--primary))]" />
              Score by Standard
            </h2>
            {standards.length ? <BarChart data={standards.map((s) => ({ label: s.standard, value: s.score, color: colorForScore(s.score) }))} /> : <EmptyState title="No standards" description="No assessment scores found." />}
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Scores by Standard / Framework</h2>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : standards.length === 0 ? (
            <EmptyState title="No scored assessments" description="Complete assessments to populate standard scores." />
          ) : (
            <div className="space-y-2">
              {standards.map((s) => (
                <button
                  key={s.standard}
                  type="button"
                  onClick={() => setSelected(selected === s.standard ? null : s.standard)}
                  className="flex w-full items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm hover:bg-[rgb(var(--panel-2))]"
                >
                  <span className="font-medium">{s.standard}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-[rgb(var(--muted))]">{s.assessed} assessed</span>
                    <span className="font-semibold" style={{ color: colorForScore(s.score) }}>{s.score}%</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {drill && (
            <div className="mt-4 rounded-md bg-[rgb(var(--panel-2))] p-3 text-sm">
              <p className="font-medium">{drill.standard}</p>
              <p className="text-[rgb(var(--muted))]">Average score {drill.score}% across {drill.assessed} assessments.</p>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Compliance Trend</h2>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : trend.length ? (
            <LineChart data={trend.map((t) => ({ label: t.period, value: t.score }))} format={(v) => `${v}%`} />
          ) : (
            <EmptyState title="No trend data" description="Trend data will appear once multiple assessments are scored." />
          )}
        </Card>
      </div>
    </div>
  );
}

interface AssessmentLike {
  id: string;
  type: string;
  progress: number;
  metadata: Record<string, unknown>;
  scoringSummary?: { overallScore?: number | null } | null;
}
