'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card.js';
import { useRiskForecast, usePredictionStats } from '@/modules/predictive/hooks.js';
import type { PredictionRecord } from '@/modules/predictive/types.js';

function RiskBadge({ level }: { level: string }) {
  const color = level === 'critical' ? 'bg-red-100 text-red-700' : level === 'high' ? 'bg-orange-100 text-orange-700' : level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{level}</span>;
}

export default function RiskForecastingPage() {
  const { data: stats } = usePredictionStats();
  const { data: forecasts } = useRiskForecast();

  const items = useMemo(() => (forecasts ?? []) as PredictionRecord[], [forecasts]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Risk Forecasting</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Predict high-risk factories, departments, suppliers, compliance trends and upcoming non-conformities.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Total Predictions</p><p className="mt-1 text-lg font-semibold">{stats?.total ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Avg Probability</p><p className="mt-1 text-lg font-semibold">{Math.round(stats?.avgProbability ?? 0)}%</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Avg Confidence</p><p className="mt-1 text-lg font-semibold">{Math.round(stats?.avgConfidence ?? 0)}%</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Critical Risks</p><p className="mt-1 text-lg font-semibold">{(stats?.byRiskLevel?.critical ?? 0)}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">High Risks</p><p className="mt-1 text-lg font-semibold">{(stats?.byRiskLevel?.high ?? 0)}</p></Card>
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-color))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Entity</th>
                <th className="px-4 py-2 text-right">Probability</th>
                <th className="px-4 py-2 text-right">Confidence</th>
                <th className="px-4 py-2 text-left">Risk</th>
                <th className="px-4 py-2 text-left">Timeframe</th>
                <th className="px-4 py-2 text-left">Reasoning</th>
                <th className="px-4 py-2 text-left">Suggested Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No risk forecasts available.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{item.title}</td>
                    <td className="px-4 py-2 text-xs">{item.category}</td>
                    <td className="px-4 py-2 text-xs">{item.entityType}{item.entityId ? ` · ${item.entityId}` : ''}</td>
                    <td className="px-4 py-2 text-right">{Math.round(item.probability)}%</td>
                    <td className="px-4 py-2 text-right">{Math.round(item.confidenceScore)}%</td>
                    <td className="px-4 py-2"><RiskBadge level={item.riskLevel} /></td>
                    <td className="px-4 py-2 text-xs">{item.timeframe ?? '—'}</td>
                    <td className="px-4 py-2 text-xs">{item.reasoning ?? '—'}</td>
                    <td className="px-4 py-2 text-xs">{(item.suggestedActions ?? []).join(', ') || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
