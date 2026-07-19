'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useAnalyticsUiStore, useKpis, useTrends, useHeatmap } from '@/modules/analytics/store.js';

export default function ExecutiveDashboardPage() {
  const { dateFrom, dateTo } = useAnalyticsUiStore();
  const { data: kpis } = useKpis({ dateFrom, dateTo });
  const { data: trends } = useTrends('cases', 'month');
  const { data: heatmap } = useHeatmap('cases');

  const trendPoints = useMemo(() => (trends ?? []).slice(-6).map((t) => ({ label: t.period, value: t.count })), [trends]);
  const heatmapSummary = useMemo(() => (heatmap ?? []).reduce((sum, item) => sum + item.count, 0), [heatmap]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Leadership snapshot of compliance performance, case volume, and trend direction.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Open cases</p>
          <p className="mt-2 text-2xl font-semibold">{kpis?.openCases ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Closed cases</p>
          <p className="mt-2 text-2xl font-semibold">{kpis?.closedCases ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Escalations</p>
          <p className="mt-2 text-2xl font-semibold">{kpis?.escalatedCases ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Heatmap activity</p>
          <p className="mt-2 text-2xl font-semibold">{heatmapSummary}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[rgb(var(--primary))]" />
            <h2 className="text-sm font-semibold">Monthly trend view</h2>
          </div>
          <div className="space-y-2">
            {trendPoints.length ? trendPoints.map((point) => (
              <div key={point.label} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <span>{point.label}</span>
                <span className="font-semibold">{point.value}</span>
              </div>
            )) : <p className="text-sm text-[rgb(var(--muted))]">No trend data available.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[rgb(var(--primary))]" />
            <h2 className="text-sm font-semibold">Leadership focus areas</h2>
          </div>
          <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
            <li>• Review open high-risk cases weekly.</li>
            <li>• Track SLA compliance and response latency.</li>
            <li>• Prioritize recurring findings in the next audit cycle.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
