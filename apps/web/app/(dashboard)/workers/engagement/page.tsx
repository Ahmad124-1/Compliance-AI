'use client';

import Link from 'next/link';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { useEngagementDashboard } from '@/modules/engagement/store.js';
import { ENGAGEMENT_ROUTES } from '@/modules/engagement/constants.js';

export default function EngagementDashboardPage() {
  const { session } = useAuth();
  const { data: dash, isLoading, refetch } = useEngagementDashboard();

  const insights = dash?.aiRecommendations ?? [];
  const loading = isLoading;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Engagement & Wellbeing</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{session?.organization.name} - Overview</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Engagement Score" value={String(dash?.overallEngagementScore ?? '-')} />
        <StatTile label="Wellbeing Score" value={String(dash?.wellbeingScore ?? '-')} />
        <StatTile label="Participation Rate" value={`${dash?.participationRate ?? 0}%`} />
        <StatTile label="Survey Completion" value={`${dash?.surveyCompletion ?? 0}%`} />
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Recognition Activity" value={String(dash?.recognitionActivity ?? 0)} />
        <StatTile label="Training Participation" value={String(dash?.trainingParticipation ?? 0)} />
        <StatTile label="Communication Effectiveness" value={String(dash?.communicationEffectiveness ?? 0)} />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Department Rankings</h2>
          {dash?.departmentRankings?.length ? (
            <div className="space-y-2">
              {dash.departmentRankings.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-2 text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">Engagement: {d.engagementScore} - Participation: {d.participationRate}%</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[rgb(var(--muted))]">No department data yet.</p>}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">AI Recommendations</h2>
          <div className="space-y-2">
            {insights.map((rec, i) => (
              <div key={i} className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-2 text-sm">
                {rec}
              </div>
            ))}
            {insights.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No recommendations yet.</p>}
          </div>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-md border border-[rgb(var(--border-color))] px-3 py-1.5 text-xs hover:bg-[rgb(var(--panel-2))]"
          >
            Refresh Insights
          </button>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href={ENGAGEMENT_ROUTES.surveys}><Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]"><p className="text-sm font-medium">Surveys</p></Card></Link>
          <Link href={ENGAGEMENT_ROUTES.recognition}><Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]"><p className="text-sm font-medium">Recognition</p></Card></Link>
          <Link href={ENGAGEMENT_ROUTES.wellbeing}><Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]"><p className="text-sm font-medium">Wellbeing</p></Card></Link>
          <Link href={ENGAGEMENT_ROUTES.community}><Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]"><p className="text-sm font-medium">Community</p></Card></Link>
        </div>
      </section>
    </div>
  );
}
