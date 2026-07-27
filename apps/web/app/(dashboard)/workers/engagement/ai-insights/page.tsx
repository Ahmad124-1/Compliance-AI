'use client';

import { useMemo } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { useAiInsights, useGenerateAiInsights } from '@/modules/engagement/store.js';
import { Sparkles, CheckCircle } from 'lucide-react';

const severityColors: Record<string, string> = {
  critical: 'border-red-300 bg-red-50 text-red-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  info: 'border-blue-300 bg-blue-50 text-blue-900',
};

export default function AiInsightsPage() {
  const { data: insights, isLoading } = useAiInsights();
  const { mutateAsync: generate, isLoading: generating } = useGenerateAiInsights();

  const resolvedCount = useMemo(() => insights?.filter((i) => i.isResolved).length ?? 0, [insights]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Insights</h1>
          <p className="text-sm text-[rgb(var(--muted))]">{insights?.length ?? 0} insights · {resolvedCount} resolved</p>
        </div>
        <button
          onClick={() => generate().then(() => window.location.reload())}
          disabled={generating}
          className="flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" /> {generating ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(insights ?? []).length === 0 && <EmptyState title="No insights yet" description="Generate AI-powered engagement insights to surface trends and risks." />}
          {(insights ?? []).map((insight) => (
            <Card key={insight.id} className={`p-4 border-l-4 ${severityColors[insight.severity] || severityColors.info}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{insight.title}</h3>
                  <p className="mt-1 text-xs opacity-80">{insight.description}</p>
                  {insight.recommendations?.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-xs opacity-80">
                      {insight.recommendations.slice(0, 3).map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
                {!insight.isResolved && (
                  <button className="flex items-center gap-1 rounded-md border border-current px-2 py-1 text-xs hover:opacity-80">
                    <CheckCircle className="h-3 w-3" /> Resolve
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
