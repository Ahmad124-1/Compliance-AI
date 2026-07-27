'use client';

import { ListChecks, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useAiJobs, useAiJobStats } from '@/modules/ai/hooks.js';

const STATUS_COLORS: Record<string, string> = {
  queued: 'text-sky-500',
  running: 'text-amber-500',
  retrying: 'text-amber-500',
  completed: 'text-emerald-500',
  failed: 'text-rose-500',
  cancelled: 'text-[rgb(var(--muted))]',
};

export function AiJobsPanel() {
  const { data: jobs, isLoading } = useAiJobs();
  const { data: stats } = useAiJobStats();

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-[rgb(var(--primary))]" />
        <h2 className="text-sm font-semibold">Background AI Jobs</h2>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(stats).map(([k, v]) => (
            <span key={k} className="rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-[rgb(var(--muted))]">
              {k}: <span className="font-medium text-[rgb(var(--text))]">{v}</span>
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]"><Loader2 className="h-4 w-4 animate-spin" /> Loading jobs…</p>
      ) : (
        <ul className="max-h-80 space-y-1.5 overflow-y-auto text-xs">
          {(jobs ?? []).map((j) => (
            <li key={j.id} className="flex items-center justify-between rounded border border-[rgb(var(--border-color))] px-2 py-1.5">
              <span className="flex items-center gap-2">
                <span className="font-medium text-[rgb(var(--text))]">{j.type}</span>
                <span className={`${STATUS_COLORS[j.status] ?? ''}`}>{j.status}</span>
                {j.attempts > 1 && <span className="text-[rgb(var(--muted))]">×{j.attempts}</span>}
              </span>
              <span className="text-[rgb(var(--muted))]">{j.progress}%</span>
            </li>
          ))}
          {jobs?.length === 0 && <li className="text-[rgb(var(--muted))]">No jobs queued.</li>}
        </ul>
      )}
    </Card>
  );
}
