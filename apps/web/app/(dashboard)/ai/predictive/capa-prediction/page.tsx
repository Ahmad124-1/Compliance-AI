'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card.js';
import { usePredictionStats, usePredictions } from '@/modules/predictive/hooks.js';
import type { PredictionRecord } from '@/modules/predictive/types.js';

export default function CAPAPredictionPage() {
  const { data: stats } = usePredictionStats();
  const { data: predictions } = usePredictions({ type: 'capa_prediction' });

  const capaPredictions = useMemo(() => (predictions ?? []) as PredictionRecord[], [predictions]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CAPA Prediction</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Predict CAPAs likely to become overdue, fail, departments causing repeated CAPAs, root cause trends and preventive actions.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Total Predictions</p><p className="mt-1 text-lg font-semibold">{stats?.total ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Avg Probability</p><p className="mt-1 text-lg font-semibold">{Math.round(stats?.avgProbability ?? 0)}%</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Avg Confidence</p><p className="mt-1 text-lg font-semibold">{Math.round(stats?.avgConfidence ?? 0)}%</p></Card>
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-color))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Probability</th>
                <th className="px-4 py-2 text-right">Confidence</th>
                <th className="px-4 py-2 text-left">Risk</th>
                <th className="px-4 py-2 text-left">Reasoning</th>
                <th className="px-4 py-2 text-left">Preventive Actions</th>
              </tr>
            </thead>
            <tbody>
              {capaPredictions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No CAPA predictions available.</td></tr>
              ) : (
                capaPredictions.map((item) => (
                  <tr key={item.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{item.title}</td>
                    <td className="px-4 py-2 text-xs">{item.category}</td>
                    <td className="px-4 py-2 text-right">{Math.round(item.probability)}%</td>
                    <td className="px-4 py-2 text-right">{Math.round(item.confidenceScore)}%</td>
                    <td className="px-4 py-2 text-xs">{item.riskLevel}</td>
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
