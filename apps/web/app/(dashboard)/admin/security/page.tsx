'use client';

import { ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { QueryError, EmptyState } from '@/components/ui/index.js';
import { cn } from '@/lib/cn';
import { useSecurityReview } from '@/modules/security/index.js';
import type { SecurityCheck } from '@/modules/security/types.js';

const STATUS_META: Record<SecurityCheck['status'], { icon: React.ReactNode; label: string; color: string }> = {
  pass: { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Pass', color: 'text-emerald-600 dark:text-emerald-400' },
  warn: { icon: <AlertTriangle className="h-4 w-4" />, label: 'Warning', color: 'text-amber-600 dark:text-amber-400' },
  fail: { icon: <XCircle className="h-4 w-4" />, label: 'Fail', color: 'text-red-600 dark:text-red-400' },
};

export default function SecurityReviewPage() {
  const { data, isLoading, isError, error, refetch } = useSecurityReview();

  const scoreColor = !data ? '' : data.score >= 80 ? 'text-emerald-600' : data.score >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Security Review</h1>
        <p className="text-xs text-[rgb(var(--muted))]">Continuous posture assessment across RBAC, tenant isolation, auth, data and audit.</p>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}
      {isError && <QueryError error={error} onRetry={() => refetch()} />}
      {!isLoading && !isError && !data && <EmptyState title="No report available" />}

      {data && (
        <Card className="flex items-center gap-6 p-6">
          <div className="flex flex-col items-center">
            <span className={cn('text-4xl font-bold', scoreColor)}>{data.score}</span>
            <span className="text-xs text-[rgb(var(--muted))]">/ 100</span>
          </div>
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--panel-2))]">
              <div className={cn('h-full rounded-full', data.score >= 80 ? 'bg-emerald-500' : data.score >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${data.score}%` }} />
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">Generated {new Date(data.generatedAt).toLocaleString()}</p>
          </div>
        </Card>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.checks.map((c) => {
            const meta = STATUS_META[c.status];
            const Icon = c.status === 'pass' ? ShieldCheck : c.status === 'warn' ? ShieldAlert : ShieldX;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className={meta.color}>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[rgb(var(--text))]">{c.title}</p>
                      <span className={cn('text-[10px] font-semibold uppercase', meta.color)}>{meta.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{c.detail}</p>
                    <span className="mt-2 inline-block rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[10px] uppercase text-[rgb(var(--muted-2))]">{c.category}</span>
                  </div>
                  <Icon className={cn('h-5 w-5 shrink-0', meta.color)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
