'use client';

import { useMemo } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { StatTile, LineChart, BarChart } from '@/components/ui';
import { useEngagementTrends, useParticipationTrends, useDepartmentComparison } from '@/modules/engagement/store.js';

export default function AnalyticsPage() {
  const { data: trends, isLoading: tLoading } = useEngagementTrends('month');
  const { data: participation, isLoading: pLoading } = useParticipationTrends('month');
  const { data: departments, isLoading: dLoading } = useDepartmentComparison();

  const engagementData = useMemo(() => (trends ?? []).map((t) => ({ label: t.period, value: t.engagementScore || 0 })), [trends]);
  const wellbeingData = useMemo(() => (trends ?? []).map((t) => ({ label: t.period, value: t.wellbeingScore || 0 })), [trends]);
  const participationData = useMemo(() => (participation ?? []).map((p) => ({ label: p.date, value: p.participationRate || 0 })), [participation]);
  const deptChartData = useMemo(() => (departments ?? []).map((d) => ({ label: d.name, value: d.engagementScore })), [departments]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Engagement Analytics</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Trends, participation, and department comparison</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Trend Data Points" value={String(trends?.length ?? 0)} />
        <StatTile label="Departments" value={String(departments?.length ?? 0)} />
        <StatTile label="Avg Engagement" value={trends?.length ? String(Math.round((trends as any[]).reduce((s, t) => s + (t.engagementScore || 0), 0) / (trends as any[]).length)) : '—'} />
        <StatTile label="Avg Participation" value={participation?.length ? String(Math.round((participation as any[]).reduce((s, p) => s + (p.participationRate || 0), 0) / (participation as any[]).length)) + '%' : '—'} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Engagement Trend</h2>
          {tLoading ? <Skeleton className="h-48 w-full" /> : engagementData.length ? <LineChart data={engagementData} /> : <EmptyState title="No trend data" description="Data will appear as scores are collected." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Wellbeing Trend</h2>
          {tLoading ? <Skeleton className="h-48 w-full" /> : wellbeingData.length ? <LineChart data={wellbeingData} /> : <EmptyState title="No trend data" description="Wellbeing assessments will generate trend data." />}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Participation Rate</h2>
          {pLoading ? <Skeleton className="h-48 w-full" /> : participationData.length ? <BarChart data={participationData} /> : <EmptyState title="No participation data" description="Survey responses will generate participation metrics." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Department Comparison</h2>
          {dLoading ? <Skeleton className="h-48 w-full" /> : deptChartData.length ? <BarChart data={deptChartData} /> : <EmptyState title="No department data" description="Department summaries will appear here." />}
        </Card>
      </div>
    </div>
  );
}
