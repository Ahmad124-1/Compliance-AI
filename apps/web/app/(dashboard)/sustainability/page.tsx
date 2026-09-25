'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, ArrowRight, Package, Target, Activity, Rocket, FileText as ReportIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { DonutChart, BarChart, StatTile } from '@/components/ui/charts';
import { useQuery } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';

const ESG_PILLAR_COLORS: Record<string, string> = {
  environment: 'rgb(34 197 94)',
  social: 'rgb(59 130 246)',
  governance: 'rgb(168 85 247)',
};

const GOAL_STATUS_COLORS: Record<string, string> = {
  achieved: 'rgb(34 197 94)',
  in_progress: 'rgb(59 130 246)',
  at_risk: 'rgb(239 68 68)',
  not_started: 'rgb(156 163 175)',
};

export default function SustainabilityOverviewPage() {
  const [search, setSearch] = useState('');

  const dashboardQuery = useQuery({
    queryKey: ['sustainability', 'dashboard'],
    queryFn: () => sustainabilityService.getDashboard(),
  });

  const programsQuery = useQuery({
    queryKey: ['sustainability', 'programs'],
    queryFn: () => sustainabilityService.listPrograms({ limit: 5 }),
  });

  const goalsQuery = useQuery({
    queryKey: ['sustainability', 'goals'],
    queryFn: () => sustainabilityService.listGoals({ limit: 5 }),
  });

  const initiativesQuery = useQuery({
    queryKey: ['sustainability', 'initiatives'],
    queryFn: () => sustainabilityService.listInitiatives({ limit: 5 }),
  });

  const goalCompletionQuery = useQuery({
    queryKey: ['sustainability', 'analytics', 'goal-completion'],
    queryFn: () => sustainabilityService.getGoalCompletion(),
  });

  const esgPillarQuery = useQuery({
    queryKey: ['sustainability', 'analytics', 'esg-pillar'],
    queryFn: () => sustainabilityService.getEsgPillarDistribution(),
  });

  const sdgContributionQuery = useQuery({
    queryKey: ['sustainability', 'analytics', 'sdg-contribution'],
    queryFn: () => sustainabilityService.getSdgContributionAnalytics(),
  });

  const departmentComparisonQuery = useQuery({
    queryKey: ['sustainability', 'analytics', 'department-comparison'],
    queryFn: () => sustainabilityService.getDepartmentComparison(),
  });

  const initiativePerformanceQuery = useQuery({
    queryKey: ['sustainability', 'analytics', 'initiative-performance'],
    queryFn: () => sustainabilityService.getInitiativePerformance(),
  });

  const dashboard = dashboardQuery.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sustainability</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage programs, ESG goals, SDGs, initiatives, KPIs, and reporting.</p>
      </div>

      {/* Stats Cards */}
      {dashboardQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : dashboardQuery.isError ? (
        <ErrorState title="Failed to load dashboard" onRetry={() => dashboardQuery.refetch()} />
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile label="Programs" value={dashboard.totalPrograms} hint={`${dashboard.activePrograms} active`} />
          <StatTile label="Goals" value={dashboard.totalGoals} hint={`${dashboard.achievedGoals} achieved`} />
          <StatTile label="KPIs" value={dashboard.totalKpis} hint={`${dashboard.kpisAtRisk} at risk`} />
          <StatTile label="Initiatives" value={dashboard.totalInitiatives} hint={`${dashboard.initiativesOnTrack} on track`} />
        </div>
      ) : null}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ESG Pillar Distribution */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">ESG Pillar Distribution</h2>
          {esgPillarQuery.isLoading ? (
            <SkeletonCard />
          ) : esgPillarQuery.data ? (
            <DonutChart
              data={Object.entries(esgPillarQuery.data).map(([key, value]) => ({
                label: key.charAt(0).toUpperCase() + key.slice(1),
                value: value as number,
                color: ESG_PILLAR_COLORS[key] || 'rgb(156 163 175)',
              }))}
              size={180}
            />
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No data available</p>
          )}
        </Card>

        {/* Goal Completion */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Goal Completion Status</h2>
          {goalCompletionQuery.isLoading ? (
            <SkeletonCard />
          ) : goalCompletionQuery.data ? (
            <DonutChart
              data={[
                { label: 'Achieved', value: goalCompletionQuery.data.completed, color: GOAL_STATUS_COLORS.achieved },
                { label: 'In Progress', value: goalCompletionQuery.data.inProgress, color: GOAL_STATUS_COLORS.in_progress },
                { label: 'Remaining', value: Math.max(0, goalCompletionQuery.data.total - goalCompletionQuery.data.completed - goalCompletionQuery.data.inProgress), color: GOAL_STATUS_COLORS.not_started },
              ]}
              size={180}
            />
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No data available</p>
          )}
        </Card>
      </div>

      {/* Recent Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Programs</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/sustainability/programs">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {programsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : programsQuery.data?.length ? (
            <ul className="space-y-2">
              {programsQuery.data.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <Link href={`/sustainability/programs/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.status === 'active' ? 'bg-green-100 text-green-800' :
                    p.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{p.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No programs yet</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">ESG Goals</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/sustainability/goals">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {goalsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : goalsQuery.data?.length ? (
            <ul className="space-y-2">
              {goalsQuery.data.map((g: any) => (
                <li key={g.id} className="text-sm">
                  <Link href={`/sustainability/goals/${g.id}`} className="flex items-center justify-between font-medium hover:underline">
                    <span>{g.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      g.status === 'achieved' ? 'bg-green-100 text-green-800' :
                      g.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      g.status === 'at_risk' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{g.status}</span>
                  </Link>
                  <div className="mt-1 h-1.5 rounded-full bg-[rgb(var(--muted))]">
                    <div className="h-1.5 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${g.progressPct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No goals yet</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Initiatives</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/sustainability/initiatives">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {initiativesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : initiativesQuery.data?.length ? (
            <ul className="space-y-2">
              {initiativesQuery.data.map((init: any) => (
                <li key={init.id} className="text-sm">
                  <Link href={`/sustainability/initiatives/${init.id}`} className="flex items-center justify-between font-medium hover:underline">
                    <span>{init.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      init.status === 'completed' ? 'bg-green-100 text-green-800' :
                      init.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      init.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{init.status}</span>
                  </Link>
                  <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{init.milestonesCount} milestones</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No initiatives yet</p>
          )}
        </Card>
      </div>

      {/* SDG Contribution & Department Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        {sdgContributionQuery.data && (
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">SDG Contribution</h2>
            <BarChart
              data={Object.entries(sdgContributionQuery.data as Record<string, number>).map(([sdgId, value]) => ({
                label: `SDG ${sdgId}`,
                value: value,
              }))}
              height={200}
            />
          </Card>
        )}

        {departmentComparisonQuery.data && (
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Department Performance</h2>
            <BarChart
              data={Object.entries(departmentComparisonQuery.data as Record<string, { avg: number; count: number }>).map(([dept, data]) => ({
                label: dept,
                value: data.avg || 0,
              }))}
              height={200}
            />
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/sustainability/programs/new"><PlusCircle className="mr-2 h-4 w-4" />New Program</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sustainability/goals/new"><PlusCircle className="mr-2 h-4 w-4" />New Goal</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sustainability/initiatives/new"><PlusCircle className="mr-2 h-4 w-4" />New Initiative</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sustainability/kpis/new"><PlusCircle className="mr-2 h-4 w-4" />New KPI</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sustainability/reports/new"><ReportIcon className="mr-2 h-4 w-4" />Generate Report</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
