'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState, StatTile } from '@/components/ui';
import { useSurveys, useCreateSurvey } from '@/modules/engagement/store.js';
import { ENGAGEMENT_ROUTES, SURVEY_TYPES } from '@/modules/engagement/constants.js';
import { FileText, Plus } from 'lucide-react';

export default function SurveysPage() {
  const { data: surveys, isLoading } = useSurveys();

  const activeSurveys = useMemo(() => (surveys ?? []).filter((s) => s.status === 'active'), [surveys]);
  const draftSurveys = useMemo(() => (surveys ?? []).filter((s) => s.status === 'draft'), [surveys]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pulse Surveys</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create and manage engagement surveys</p>
        </div>
        <Link href={ENGAGEMENT_ROUTES.surveyBuilder}>
          <button className="flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:opacity-90">
            <Plus className="h-4 w-4" /> New Survey
          </button>
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active Surveys" value={String(activeSurveys.length)} />
        <StatTile label="Drafts" value={String(draftSurveys.length)} />
        <StatTile label="Total" value={String(surveys?.length ?? 0)} />
        <StatTile label="Survey Types" value={String(SURVEY_TYPES.filter((t) => (surveys ?? []).some((s) => s.surveyType === t)).length)} />
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(surveys ?? []).length === 0 && (
            <EmptyState title="No surveys" description="Create your first pulse survey to start measuring engagement." />
          )}
          {(surveys ?? []).map((s) => (
            <Link key={s.id} href={`${ENGAGEMENT_ROUTES.surveyAnalytics}/${s.id}`}>
              <Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{s.title}</h3>
                    <p className="text-xs text-[rgb(var(--muted))]">{s.surveyType} · {s.status}</p>
                  </div>
                  <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                </div>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">Anonymous: {s.isAnonymous ? 'Yes' : 'No'} · Recurring: {s.isRecurring ? 'Yes' : 'No'}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
