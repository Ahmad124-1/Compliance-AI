'use client';

import { Cpu, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { EmptyState } from '@/components/ui/states.js';
import { AI_PROVIDER_LABELS } from '@/modules/ai/constants.js';
import { useAiCapabilities } from '@/modules/ai/hooks.js';

const CAPABILITY_LABELS: Record<string, string> = {
  categorize: 'Complaint Categorization',
  detectPriority: 'Priority Detection',
  detectSeverity: 'Severity Detection',
  analyzeSentiment: 'Sentiment Analysis',
  scoreRisk: 'Risk Scoring',
  detectLanguage: 'Language Detection',
  translate: 'Translation',
  summarize: 'Complaint Summarization',
  detectDuplicates: 'Duplicate Detection',
  mapFrameworks: 'Framework Mapping',
  recommend: 'Recommendations',
};

export function AiStatusCard() {
  const { data, isLoading } = useAiCapabilities();

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="mt-3 h-4 w-full" />
      </Card>
    );
  }

  const providerLabel = AI_PROVIDER_LABELS[data?.provider.kind ?? 'null'] ?? data?.provider.displayName ?? 'Disabled';
  const caps = data?.capabilities;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Cpu className="h-5 w-5 text-[rgb(var(--primary))]" />
        <h2 className="text-sm font-semibold">AI Provider</h2>
        <span className="ml-auto rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs text-[rgb(var(--muted))]">{providerLabel}</span>
      </div>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        The AI foundation is wired for future providers (OpenAI, Gemini, Azure, Local). Capabilities below become
        active when a provider is configured. No model calls are made in this build.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {caps &&
          Object.entries(caps).map(([key, enabled]) => (
            <div
              key={key}
              className="flex items-center gap-1.5 rounded-md border border-[rgb(var(--border-color))] px-2 py-1.5 text-xs"
            >
              <Sparkles className={`h-3.5 w-3.5 ${enabled ? 'text-emerald-500' : 'text-[rgb(var(--muted-2))]'}`} />
              <span className={enabled ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]'}>
                {CAPABILITY_LABELS[key] ?? key}
              </span>
            </div>
          ))}
      </div>
      {!caps && <EmptyState title="No provider configured" className="mt-3" />}
    </Card>
  );
}
