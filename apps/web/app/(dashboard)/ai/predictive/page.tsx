'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  LineChart,
  Users,
  Factory,
  ClipboardList,
  Lightbulb,
  FlaskConical,
} from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { usePredictionStats, useRiskForecast, useComplianceTrends } from '@/modules/predictive/hooks.js';

const TILES = [
  { href: '/ai/predictive/risk-forecasting', label: 'Risk Forecasting', icon: AlertTriangle, desc: 'Predict high-risk factories, departments, suppliers and violations' },
  { href: '/ai/predictive/audit-prediction', label: 'Audit Prediction', icon: ClipboardList, desc: 'Likelihood of audit failure, failed clauses, evidence gaps' },
  { href: '/ai/predictive/capa-prediction', label: 'CAPA Prediction', icon: LineChart, desc: 'CAPAs likely to become overdue, fail, root cause trends' },
  { href: '/ai/predictive/worker-behaviour', label: 'Worker Behaviour', icon: Users, desc: 'Grievance trends, hotspots, satisfaction trends' },
  { href: '/ai/predictive/supplier-risk', label: 'Supplier Risk', icon: Factory, desc: 'Supplier compliance decline, late actions, human rights risks' },
  { href: '/ai/predictive/compliance-trends', label: 'Compliance Trends', icon: TrendingUp, desc: 'Monthly, yearly, department and factory comparisons' },
  { href: '/ai/predictive/recommendations', label: 'AI Recommendations', icon: Lightbulb, desc: 'Prioritized actions with expected impact and effort' },
  { href: '/ai/predictive/scenario-simulator', label: 'Scenario Simulator', icon: FlaskConical, desc: 'What-if analysis for CAPA, response time, supplier risk' },
];

export default function PredictiveIntelligencePage() {
  const { data: stats } = usePredictionStats();
  const { data: riskForecast } = useRiskForecast();
  const { data: trends } = useComplianceTrends();

  const summary = useMemo(() => {
    const items = [
      { label: 'Total Predictions', value: String(stats?.total ?? 0) },
      { label: 'Avg Probability', value: `${Math.round(stats?.avgProbability ?? 0)}%` },
      { label: 'Avg Confidence', value: `${Math.round(stats?.avgConfidence ?? 0)}%` },
      { label: 'Risk Forecasts', value: String(riskForecast?.length ?? 0) },
      { label: 'Trend Series', value: trends ? `${Object.keys(trends).length} series` : '0' },
    ];
    return items;
  }, [stats, riskForecast, trends]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Predictive Intelligence</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Forecast compliance risks, audit outcomes, and operational trends before they happen.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Modules</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.href} href={tile.href}>
                <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                  <Icon className="h-5 w-5 text-[rgb(var(--primary))]" />
                  <div>
                    <p className="text-sm font-medium">{tile.label}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{tile.desc}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
