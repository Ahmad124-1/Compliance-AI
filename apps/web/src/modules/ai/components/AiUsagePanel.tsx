'use client';

import { BarChart3 } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useAiUsage } from '@/modules/ai/hooks.js';

export function AiUsagePanel() {
  const { data, isLoading } = useAiUsage(30);

  if (isLoading) return <Card className="p-4 text-sm text-[rgb(var(--muted))]">Loading usage…</Card>;
  if (!data) return <Card className="p-4 text-sm text-[rgb(var(--muted))]">No usage data.</Card>;

  const s = data.summary;
  const totalCost = Number(s.totalCostUsd ?? 0).toFixed(2);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[rgb(var(--primary))]" />
        <h2 className="text-sm font-semibold">Token Accounting & Cost</h2>
        <span className="ml-auto text-xs text-[rgb(var(--muted))]">Last 30 days</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Spend (USD)" value={`$${totalCost}`} />
        <Stat label="Total tokens" value={Number(s.totalTokens).toLocaleString()} />
        <Stat label="Completion" value={Number(s.completionTokens).toLocaleString()} />
        <Stat label="Embedding" value={Number(s.embeddingTokens).toLocaleString()} />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-[rgb(var(--muted))]">By provider</h3>
        <div className="space-y-1.5">
          {Object.entries(s.byProvider ?? {}).map(([provider, v]) => (
            <div key={provider} className="flex items-center justify-between text-xs">
              <span className="text-[rgb(var(--text))]">{provider}</span>
              <span className="text-[rgb(var(--muted))]">${Number(v.costUsd).toFixed(2)} · {Number(v.tokens).toLocaleString()} tok</span>
            </div>
          ))}
          {Object.keys(s.byProvider ?? {}).length === 0 && (
            <p className="text-xs text-[rgb(var(--muted))]">No requests recorded yet.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-[rgb(var(--muted))]">Recent requests</h3>
        <ul className="max-h-56 space-y-1 overflow-y-auto text-xs">
          {data.recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded border border-[rgb(var(--border-color))] px-2 py-1.5">
              <span className="text-[rgb(var(--text))]">{r.provider}/{r.model}</span>
              <span className="text-[rgb(var(--muted))]">
                {Number(r.totalTokens).toLocaleString()} tok · ${Number(r.costUsd).toFixed(4)}
                {r.cached && <span className="ml-1 text-emerald-500">cached</span>}
              </span>
            </li>
          ))}
          {data.recent.length === 0 && <li className="text-[rgb(var(--muted))]">No requests yet.</li>}
        </ul>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--border-color))] p-3">
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</p>
    </div>
  );
}
