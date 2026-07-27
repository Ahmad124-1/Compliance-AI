'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Filter, Search, FolderOpen, BarChart3, ArrowRight, Package, Target, Activity, Rocket, FileText as ReportIcon, Settings } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { PROGRAM_CATEGORIES, PROGRAM_STATUSES } from '@/modules/sustainability/constants.js';

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

  const dashboard = dashboardQuery.data;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Sustainability</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage programs, ESG goals, SDGs, initiatives, KPIs, and reporting.</p>
      </div>

      {dashboardQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-24 rounded bg-[rgb(var(--muted))] animate-pulse" />
              <div className="mt-2 h-8 w-16 rounded bg-[rgb(var(--muted))] animate-pulse" />
            </Card>
          ))}
        </div>
      ) : dashboardQuery.isError ? (
        <Card className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load dashboard data.</Card>
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Package className="h-4 w-4" /> Programs
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.totalPrograms}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{dashboard.activePrograms} active</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Target className="h-4 w-4" /> Goals
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.totalGoals}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{dashboard.achievedGoals} achieved</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Activity className="h-4 w-4" /> KPIs
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.totalKpis}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{dashboard.kpisAtRisk} at risk</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Rocket className="h-4 w-4" /> Initiatives
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.totalInitiatives}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{dashboard.initiativesOnTrack} on track</p>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Programs</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sustainability/programs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {programsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : programsQuery.data?.length ? (
            <ul className="space-y-2">
              {programsQuery.data.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{p.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No programs yet</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">ESG Goals</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sustainability/goals">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {goalsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : goalsQuery.data?.length ? (
            <ul className="space-y-2">
              {goalsQuery.data.map((g: any) => (
                <li key={g.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{g.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${g.status === 'achieved' ? 'bg-green-100 text-green-800' : g.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{g.status}</span>
                  </div>
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

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Initiatives</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sustainability/initiatives">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {initiativesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : initiativesQuery.data?.length ? (
            <ul className="space-y-2">
              {initiativesQuery.data.map((init: any) => (
                <li key={init.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{init.name}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">{init.status}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{init.milestonesCount} milestones</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No initiatives yet</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/sustainability/programs"><PlusCircle className="mr-2 h-4 w-4" />New Program</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/sustainability/goals"><PlusCircle className="mr-2 h-4 w-4" />New Goal</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/sustainability/initiatives"><PlusCircle className="mr-2 h-4 w-4" />New Initiative</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/sustainability/reports"><ReportIcon className="mr-2 h-4 w-4" />Generate Report</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}