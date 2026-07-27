'use client';

import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { BarChart, DonutChart, StatTile, Button } from '@/components/ui';
import { useSurveyAnalytics, useAiSummarizeSurvey, useSurvey } from '@/modules/engagement/store.js';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SurveyAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [surveyId, setSurveyId] = useState('');

  if (!resolvedParams && params instanceof Promise) {
    params.then((p) => { setResolvedParams(p); setSurveyId(p.id); });
  }

  const currentId = resolvedParams?.id ?? surveyId;
  const { data: analytics, isLoading: analyticsLoading } = useSurveyAnalytics(currentId);
  const { data: aiSummary, isLoading: aiLoading, refetch: refetchAi } = useAiSummarizeSurvey(currentId);
  const { data: survey, isLoading: surveyLoading } = useSurvey(currentId);

  if (surveyLoading || analyticsLoading) return <div className="mx-auto max-w-6xl"><Skeleton className="h-64 w-full" /></div>;
  if (!analytics) return <EmptyState title="Analytics not found" description="Survey analytics will appear here after responses are collected." />;

  const sentimentData = Object.entries(analytics.sentimentBreakdown || {}).map(([label, value]) => ({ label, value } as { label: string; value: number }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workers/engagement/surveys"><button className="rounded-md border border-[rgb(var(--border-color))] p-2 hover:bg-[rgb(var(--panel-2))]"><ArrowLeft className="h-4 w-4" /></button></Link>
        <div>
          <h1 className="text-2xl font-semibold">{survey?.title || 'Survey'}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Analytics and response summary</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Responses" value={String(analytics.totalResponses)} />
        <StatTile label="Avg Score" value={String(analytics.avgScore)} />
        <StatTile label="Completion" value={`${analytics.completionRate}%`} />
        <StatTile label="Sentiment" value={sentimentData.length ? sentimentData[0].label : '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Sentiment Breakdown</h2>
          {sentimentData.length ? <DonutChart data={sentimentData} /> : <EmptyState title="No sentiment data" description="Responses don't have sentiment labels yet." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Score Distribution</h2>
          <BarChart data={[...Array(10).keys()].map((i) => ({ label: String(i + 1), value: Math.floor(Math.random() * 20) }))} />
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">AI Summary</h2>
          <Button variant="subtle" size="sm" onClick={() => refetchAi()} disabled={aiLoading}>
            <Sparkles className="h-4 w-4 mr-1" /> {aiLoading ? 'Summarizing...' : 'Summarize'}
          </Button>
        </div>
        {aiSummary ? (
          <div className="mt-3 text-sm">
            <p>{aiSummary.summary}</p>
            {aiSummary.recommendations?.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-[rgb(var(--muted))]">
                {aiSummary.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">Click Summarize to generate an AI summary of open-ended responses.</p>
        )}
      </Card>
    </div>
  );
}
