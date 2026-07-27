'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { StatTile, LineChart } from '@/components/ui';
import { useAssessments, useBurnoutRisk } from '@/modules/engagement/store.js';
import { ENGAGEMENT_ROUTES } from '@/modules/engagement/constants.js';
import { Heart } from 'lucide-react';

export default function WellbeingPage() {
  const { data: assessments, isLoading } = useAssessments();
  const { data: burnout } = useBurnoutRisk();

  const recent = useMemo(() => (assessments ?? []).slice(0, 7).reverse(), [assessments]);
  const trendData = recent.map((a) => ({ label: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: a.overallWellbeingScore || 0 }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wellbeing</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Monitor your mental and physical wellbeing</p>
        </div>
        <Link href={ENGAGEMENT_ROUTES.wellbeingCheckin}>
          <button className="flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:opacity-90">
            <Heart className="h-4 w-4" /> Check In
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Latest Score" value={recent[0] ? String(recent[0].overallWellbeingScore ?? '—') : '—'} />
        <StatTile label="Burnout Risk" value={burnout?.risk?.toUpperCase() ?? '—'} />
        <StatTile label="Check-ins" value={String(recent.length)} />
        <StatTile label="Avg Score" value={recent.length ? String(Math.round(recent.reduce((s, a) => s + (a.overallWellbeingScore || 0), 0) / recent.length)) : '—'} />
      </div>

      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Weekly Trend</h2>
          {trendData.length ? <LineChart data={trendData} /> : <EmptyState title="No data" description="Complete a wellbeing assessment to see your trend." />}
        </Card>
      )}
    </div>
  );
}
