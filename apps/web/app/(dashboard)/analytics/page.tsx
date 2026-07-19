'use client';

import { useMemo } from 'react';
import { BarChart, DonutChart, LineChart, Heatmap, StatTile } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { useAnalyticsUiStore, useKpis, useCaseAnalytics, useEscalationAnalytics, useTrends, useHeatmap, useCommunicationAnalytics } from '@/modules/analytics/store.js';
import { toDistribution } from '@/modules/analytics/api.js';

function distToBars(record?: Record<string, number>) {
  return toDistribution(record).map((d) => ({ label: d.key, value: d.count }));
}

function distToDonut(record?: Record<string, number>) {
  return toDistribution(record).map((d) => ({ label: d.key, value: d.count }));
}

export default function AnalyticsDashboard() {
  const { dateFrom, dateTo, metric, period, setDateFrom, setDateTo, setMetric, setPeriod } = useAnalyticsUiStore();
  const { data: kpis, isLoading: kpisLoading } = useKpis({ dateFrom, dateTo });
  const { data: cases, isLoading: casesLoading } = useCaseAnalytics({ dateFrom, dateTo });
  const { data: escalations } = useEscalationAnalytics();
  const { data: trends } = useTrends(metric, period);
  const { data: heatmap } = useHeatmap(metric);
  const { data: comm } = useCommunicationAnalytics({ dateFrom, dateTo });

  const commBars = useMemo(() => {
    if (!comm) return [];
    if (Array.isArray(comm)) return (comm as { channel: string; count: number }[]).map((c) => ({ label: c.channel, value: c.count }));
    return Object.entries(comm as Record<string, number>).map(([k, v]) => ({ label: k, value: v }));
  }, [comm]);

  const escalationBars = useMemo(() => toDistribution(escalations).map((d) => ({ label: d.key ?? 'unknown', value: d.count })), [escalations]);
  const trendPoints = useMemo(() => (trends ?? []).map((t) => ({ label: t.period, value: t.count })), [trends]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Complaint, SLA, escalation and communication insights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpisLoading || !kpis ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatTile label="Total Cases" value={kpis.totalCases ?? 0} />
            <StatTile label="Open" value={kpis.openCases ?? 0} />
            <StatTile label="Closed" value={kpis.closedCases ?? 0} />
            <StatTile label="Escalated" value={kpis.escalatedCases ?? 0} />
          </>
        )}
      </div>

      {casesLoading || !cases ? (
        <Skeleton className="mb-6 h-64" />
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardBlock title="Cases by Status">
            <DonutChart data={distToDonut(cases.byStatus)} format={(v) => String(v)} />
          </CardBlock>
          <CardBlock title="Cases by Priority">
            <BarChart data={distToBars(cases.byPriority)} />
          </CardBlock>
          <CardBlock title="Cases by Category">
            <BarChart data={distToBars(cases.byCategory)} />
          </CardBlock>
          <CardBlock title="Cases by Source">
            <DonutChart data={distToDonut(cases.bySource)} />
          </CardBlock>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardBlock title="Complaint Trends">
          <div className="mb-3 flex items-center gap-2">
            <select className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="cases">Cases</option>
              <option value="communication">Communication</option>
              <option value="sla">SLA</option>
              <option value="qr">QR</option>
            </select>
            <select className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <LineChart data={trendPoints} />
        </CardBlock>
        <CardBlock title="Activity Heatmap">
          <Heatmap data={heatmap ?? []} />
        </CardBlock>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardBlock title="Escalations by Rule">
          {escalationBars.length ? <BarChart data={escalationBars} /> : <p className="text-sm text-[rgb(var(--muted))]">No escalations recorded.</p>}
        </CardBlock>
        <CardBlock title="Communication by Channel">
          {commBars.length ? <DonutChart data={commBars} /> : <p className="text-sm text-[rgb(var(--muted))]">No communication data.</p>}
        </CardBlock>
      </div>
    </div>
  );
}

function CardBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
