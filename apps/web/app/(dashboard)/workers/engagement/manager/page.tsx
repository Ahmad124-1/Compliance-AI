'use client';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { StatTile } from '@/components/ui';
import { useManagerDashboard } from '@/modules/engagement/store.js';

export default function ManagerDashboardPage() {
  const { data: dash, isLoading } = useManagerDashboard();

  if (isLoading) return <div className="mx-auto max-w-6xl space-y-6"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Department-level engagement and retention overview</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Engagement" value={String(dash?.departmentEngagement ?? '—')} />
        <StatTile label="Satisfaction" value={String(dash?.workerSatisfaction ?? '—')} />
        <StatTile label="Training" value={String(dash?.trainingParticipation ?? 0)} />
        <StatTile label="Retention Risk" value={String(dash?.retentionRisk ?? 0)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Burnout Indicators</h2>
          {dash?.burnoutIndicators ? (
            <pre className="text-xs text-[rgb(var(--muted))]">{JSON.stringify(dash.burnoutIndicators, null, 2)}</pre>
          ) : <EmptyState title="No data" description="Wellbeing assessments will appear here." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Communication Metrics</h2>
          <StatTile label="Communication Effectiveness" value={String(dash?.communicationMetrics ?? '—')} />
        </Card>
      </div>
    </div>
  );
}
