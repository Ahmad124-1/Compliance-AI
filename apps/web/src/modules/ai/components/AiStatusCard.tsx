'use client';

import { Cpu, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { EmptyState } from '@/components/ui/states.js';
import { useAiCapabilities } from '@/modules/ai/hooks.js';
import { AI_PROVIDER_LABELS } from '@/modules/ai/constants.js';

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

  const providerLabel = AI_PROVIDER_LABELS[data?.provider ?? 'null'] ?? data?.provider ?? 'Disabled';
  const enabled = data?.provider && data.provider !== 'null';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Cpu className="h-5 w-5 text-[rgb(var(--primary))]" />
        <h2 className="text-sm font-semibold">AI Provider</h2>
        <span className="ml-auto rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs text-[rgb(var(--muted))]">{providerLabel}</span>
      </div>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        {enabled
          ? `Active model: ${data?.model}. Streaming ${data?.streamingEnabled ? 'enabled' : 'disabled'}. RAG top-K ${data?.rag.topK}.`
          : 'No AI provider is configured. Enable a provider in AI Settings to activate the compliance copilot, RAG and embeddings.'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {(data?.providers ?? []).map((p) => (
          <div
            key={p.kind}
            className={`flex items-center gap-1.5 rounded-md border border-[rgb(var(--border-color))] px-2 py-1.5 text-xs ${
              p.kind === data?.provider ? 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${p.chatConfigured ? 'text-emerald-500' : 'text-[rgb(var(--muted-2))]'}`} />
            <span>{p.label}</span>
          </div>
        ))}
      </div>
      {!data?.providers?.length && <EmptyState title="No providers registered" className="mt-3" />}
    </Card>
  );
}
