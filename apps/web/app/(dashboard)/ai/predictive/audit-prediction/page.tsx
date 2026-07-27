'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card.js';
import { predictiveApi } from '@/modules/predictive/api.js';

export default function AuditPredictionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-prediction'],
    queryFn: () => predictiveApi.auditPrediction(),
  });

  const result = data as any;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Prediction</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Predict likelihood of audit failure, likely failed clauses, evidence gaps and readiness score.</p>
      </div>

      {isLoading ? (
        <Card className="p-4"><p className="text-xs text-[rgb(var(--muted))]">Loading predictions…</p></Card>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Failure Likelihood</p><p className="mt-1 text-lg font-semibold">{result ? `${Math.round(result.likelihood.fail)}%` : '—'}</p></Card>
          <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Pass Likelihood</p><p className="mt-1 text-lg font-semibold">{result ? `${Math.round(result.likelihood.pass)}%` : '—'}</p></Card>
          <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Readiness Score</p><p className="mt-1 text-lg font-semibold">{result ? `${Math.round(result.readinessScore)}%` : '—'}</p></Card>
          <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Overdue CAPAs</p><p className="mt-1 text-lg font-semibold">{result ? String(result.overdueCAPAs) : '—'}</p></Card>
          <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Risky Departments</p><p className="mt-1 text-lg font-semibold">{result ? String(result.riskyDepartments.length) : '—'}</p></Card>
        </section>
      )}

      {result && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Likely Failed Clauses</h2>
            <ul className="space-y-1 text-xs">
              {(result.failedClauses ?? []).map((c: string) => (<li key={c} className="rounded border border-[rgb(var(--border-color))] px-2 py-1.5">{c}</li>))}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Evidence Gaps</h2>
            <ul className="space-y-1 text-xs">
              {(result.evidenceGaps ?? []).map((c: string) => (<li key={c} className="rounded border border-[rgb(var(--border-color))] px-2 py-1.5">{c}</li>))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
