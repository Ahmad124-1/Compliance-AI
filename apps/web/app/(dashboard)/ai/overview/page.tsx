'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  BookOpen,
  FileText,
  PenLine,
  BarChart2,
  FileSearch,
} from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useAiCapabilities, useAiUsage, useAiJobs, useKnowledgeStandards } from '@/modules/ai/hooks.js';
import { AI_PROVIDER_LABELS } from '@/modules/ai/constants.js';

const QUICK_ACTIONS = [
  { href: '/ai/chat', label: 'Start Chat', icon: MessageSquare },
  { href: '/ai/audit-assistant', label: 'Audit Assistant', icon: FileSearch },
  { href: '/ai/knowledge-base', label: 'Search Knowledge', icon: BookOpen },
  { href: '/ai/document-ai', label: 'Analyze Document', icon: FileText },
  { href: '/ai/policy-generator', label: 'Generate Policy', icon: PenLine },
  { href: '/ai/analytics', label: 'Generate Report', icon: BarChart2 },
];

export default function AiOverviewPage() {
  const { data: caps } = useAiCapabilities();
  const { data: usage } = useAiUsage(1);
  const { data: jobs } = useAiJobs();
  const { data: standards } = useKnowledgeStandards();

  const enabled = caps?.provider && caps.provider !== 'null';
  const todayUsage = usage?.summary;
  const pendingJobs = (jobs ?? []).filter((j) => j.status === 'queued' || j.status === 'running').length;

  const stats = useMemo(
    () => [
      { label: 'AI Health', value: enabled ? 'Healthy' : 'Disabled', hint: enabled ? 'All systems operational' : 'No provider configured' },
      { label: 'Active Provider', value: AI_PROVIDER_LABELS[caps?.provider ?? 'null'] ?? '—' },
      { label: 'Model', value: caps?.model ?? '—' },
      { label: 'Tokens Today', value: Number(todayUsage?.totalTokens ?? 0).toLocaleString() },
      { label: 'Requests Today', value: String(todayUsage?.requestCount ?? 0) },
      { label: 'Cost Today', value: `$${Number(todayUsage?.totalCostUsd ?? 0).toFixed(2)}` },
      { label: 'Pending Jobs', value: String(pendingJobs) },
      { label: 'Knowledge Base', value: standards?.length ? `${standards.length} standards` : 'Empty' },
      { label: 'Embedding', value: caps?.embeddingProvider ? caps.embeddingProvider : 'Disabled' },
      { label: 'Vector DB', value: caps?.rag ? 'Ready' : 'Unavailable' },
    ],
    [caps, todayUsage, pendingJobs, standards, enabled],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Compliance Copilot</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Unified enterprise AI workspace for compliance</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
            {s.hint && <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{s.hint}</p>}
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href}>
                <Card className="flex flex-col items-center gap-2 p-4 text-center transition-colors hover:bg-[rgb(var(--panel-2))]">
                  <Icon className="h-5 w-5 text-[rgb(var(--primary))]" />
                  <span className="text-xs font-medium">{a.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Provider Status</h2>
          {!caps ? (
            <p className="text-xs text-[rgb(var(--muted))]">Loading…</p>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Provider</span><span>{AI_PROVIDER_LABELS[caps.provider]}</span></div>
              <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Model</span><span>{caps.model}</span></div>
              <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Streaming</span><span>{caps.streamingEnabled ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">RAG Top-K</span><span>{caps.rag.topK}</span></div>
              <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Embedding</span><span>{caps.embeddingProvider ?? 'Disabled'}</span></div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Recent Activity</h2>
          {usage?.recent?.length ? (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto text-xs">
              {usage.recent.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded border border-[rgb(var(--border-color))] px-2 py-1.5">
                  <span className="text-[rgb(var(--text))]">{r.provider}/{r.model}</span>
                  <span className="text-[rgb(var(--muted))]">{r.totalTokens} tok · ${r.costUsd.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">No recent activity.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
