'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Factory, Leaf, Zap, Target, Brain, Sparkles, ArrowRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import Link from 'next/link';

export default function CarbonDashboardPage() {
  const [period, setPeriod] = useState('6months');

  const dashboardQuery = useQuery({
    queryKey: ['carbon', 'dashboard'],
    queryFn: () => carbonService.getDashboard(),
  });

  const dashboard = dashboardQuery.data;

  const statCards = dashboard
    ? [
        { label: 'Total Emissions', value: dashboard.totalEmissions.toLocaleString(), unit: 'tCO2e', icon: BarChart3, color: 'text-blue-500' },
        { label: 'Scope 1', value: dashboard.scope1Emissions.toLocaleString(), unit: 'tCO2e', icon: Factory, color: 'text-red-500' },
        { label: 'Scope 2', value: dashboard.scope2Emissions.toLocaleString(), unit: 'tCO2e', icon: Zap, color: 'text-orange-500' },
        { label: 'Scope 3', value: dashboard.scope3Emissions.toLocaleString(), unit: 'tCO2e', icon: Leaf, color: 'text-green-500' },
        { label: 'Net Emissions', value: dashboard.netEmissions.toLocaleString(), unit: 'tCO2e', icon: TrendingDown, color: 'text-emerald-500' },
        { label: 'Carbon Intensity', value: String(dashboard.carbonIntensity), unit: 'tCO2e/facility', icon: TrendingUp, color: 'text-purple-500' },
      ]
    : [];

  const maxMonthly = dashboard?.monthlyEmissions
    ? Math.max(...dashboard.monthlyEmissions.flatMap((m: any) => [m.scope1, m.scope2, m.scope3]), 1)
    : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Carbon Dashboard</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Overview of your carbon footprint and reduction progress.</p>
        </div>
        <div className="flex gap-2">
          {['6months', '1year', 'all'].map((p) => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}>
              {p === '6months' ? '6M' : p === '1year' ? '1Y' : 'All'}
            </Button>
          ))}
        </div>
      </div>

      {dashboardQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-20 rounded bg-[rgb(var(--muted))] animate-pulse" />
              <div className="mt-2 h-8 w-16 rounded bg-[rgb(var(--muted))] animate-pulse" />
              <div className="mt-1 h-3 w-12 rounded bg-[rgb(var(--muted))] animate-pulse" />
            </Card>
          ))}
        </div>
      ) : dashboardQuery.isError ? (
        <Card className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load dashboard data.</Card>
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <stat.icon className="h-4 w-4" /> {stat.label}
              </div>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{stat.unit}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {dashboard && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Net Zero Progress</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-4 rounded-full bg-[rgb(var(--muted))]">
                <div className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${Math.min(100, dashboard.reductionProgress || 0)}%` }} />
              </div>
              <span className="text-sm font-semibold">{Math.round(dashboard.reductionProgress || 0)}%</span>
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">{dashboard.achievedTargetsCount} of {dashboard.reductionTargetsCount} targets achieved</p>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Reduction Progress</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-4 rounded-full bg-[rgb(var(--muted))]">
                <div className="h-4 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${Math.min(100, ((dashboard.totalEmissions - dashboard.netEmissions) / Math.max(1, dashboard.totalEmissions)) * 100)}%` }} />
              </div>
              <span className="text-sm font-semibold">{Math.round(((dashboard.totalEmissions - dashboard.netEmissions) / Math.max(1, dashboard.totalEmissions)) * 100)}%</span>
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">{dashboard.activeProjects} active projects</p>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Total Offsets</h2>
            <p className="text-3xl font-semibold">{dashboard.totalOffsets}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{dashboard.totalCreditsRetired} credits retired</p>
          </Card>
        </div>
      )}

      {dashboard?.monthlyEmissions && dashboard.monthlyEmissions.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Monthly Emissions</h2>
          <div className="flex items-end gap-1 h-40">
            {dashboard.monthlyEmissions.map((m: any, i: number) => {
              const maxVal = Math.max(m.scope1 || 0, m.scope2 || 0, m.scope3 || 0, 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex gap-0.5 w-full items-end justify-center" style={{ height: '100%' }}>
                    <div className="w-3 rounded-t bg-red-400" style={{ height: `${((m.scope1 || 0) / maxVal) * 100}%` }} />
                    <div className="w-3 rounded-t bg-orange-400" style={{ height: `${((m.scope2 || 0) / maxVal) * 100}%` }} />
                    <div className="w-3 rounded-t bg-green-400" style={{ height: `${((m.scope3 || 0) / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[rgb(var(--muted))]">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-center gap-4 text-xs text-[rgb(var(--muted))]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Scope 1</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />Scope 2</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />Scope 3</span>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Top Emission Sources</h2>
          {dashboardQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : dashboard?.topEmissionSources?.length ? (
            <ul className="space-y-2">
              {dashboard.topEmissionSources.map((s: any, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.sourceName}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{s.co2e} tCO2e</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No emission sources data</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Facility Comparison</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/carbon/facilities"><ArrowRight className="ml-1 h-3 w-3" />View All</Link>
            </Button>
          </div>
          {dashboardQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-6 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : dashboard?.facilityComparison?.length ? (
            <ul className="space-y-2">
              {dashboard.facilityComparison.map((f: any, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.facilityName}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{f.emissions} tCO2e</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No facility data</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))] mb-3">
            <Brain className="h-4 w-4" /> AI Insights
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <p className="font-medium text-blue-900 dark:text-blue-100">Emission Trend</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Total emissions have decreased by {Math.round(dashboard?.reductionProgress || 0)}% this period.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
              <p className="font-medium text-amber-900 dark:text-amber-100">Scope 3 Alert</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Scope 3 emissions account for {dashboard ? ((dashboard.scope3Emissions / Math.max(1, dashboard.totalEmissions)) * 100).toFixed(1) : 0}% of total.</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <p className="font-medium text-green-900 dark:text-green-100">Recommendation</p>
              <p className="text-xs text-green-700 dark:text-green-300">Consider increasing renewable energy procurement to reduce Scope 2.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}