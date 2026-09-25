'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, ArrowRight, BarChart3, Building2, Factory, Leaf, Scale, TrendingDown, Sparkles, Target, Clock, DollarSign, Zap } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';

export default function CarbonOverviewPage() {
  const [search, setSearch] = useState('');

  const dashboardQuery = useQuery({
    queryKey: ['carbon', 'dashboard'],
    queryFn: () => carbonService.getDashboard(),
  });

  const facilitiesQuery = useQuery({
    queryKey: ['carbon', 'facilities'],
    queryFn: () => carbonService.listFacilities({ limit: 5 }),
  });

  const projectsQuery = useQuery({
    queryKey: ['carbon', 'projects'],
    queryFn: () => carbonService.listProjects({ limit: 5 }),
  });

  const offsetsQuery = useQuery({
    queryKey: ['carbon', 'offsets'],
    queryFn: () => carbonService.listOffsets({ limit: 5 }),
  });

  const targetsQuery = useQuery({
    queryKey: ['carbon', 'targets'],
    queryFn: () => carbonService.listTargets({ limit: 5 }),
  });

  const dashboard = dashboardQuery.data;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Carbon &amp; GHG</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage carbon accounting, GHG inventories, reduction projects, and offsets.</p>
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
              <Scale className="h-4 w-4" /> Total Emissions
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.totalEmissions.toLocaleString()}</p>
            <p className="text-xs text-[rgb(--muted)]">tCO2e</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Factory className="h-4 w-4" /> Scope 1
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.scope1Emissions.toLocaleString()}</p>
            <p className="text-xs text-[rgb(--muted)]">tCO2e</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Zap className="h-4 w-4" /> Scope 2
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.scope2Emissions.toLocaleString()}</p>
            <p className="text-xs text-[rgb(--muted)]">tCO2e</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Leaf className="h-4 w-4" /> Scope 3
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.scope3Emissions.toLocaleString()}</p>
            <p className="text-xs text-[rgb(--muted)]">tCO2e</p>
          </Card>
        </div>
      ) : null}

      {dashboard && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <TrendingDown className="h-4 w-4" /> Net Emissions
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.netEmissions.toLocaleString()}</p>
            <p className="text-xs text-[rgb(--muted)]">tCO2e</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <BarChart3 className="h-4 w-4" /> Intensity
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.carbonIntensity}</p>
            <p className="text-xs text-[rgb(--muted)]">tCO2e/facility</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Target className="h-4 w-4" /> Targets
            </div>
            <p className="mt-1 text-2xl font-semibold">{dashboard.achievedTargetsCount} / {dashboard.reductionTargetsCount}</p>
            <p className="text-xs text-[rgb(--muted)]">achieved</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <Sparkles className="h-4 w-4" /> AI Insights
            </div>
            <p className="mt-1 text-lg font-semibold">Active</p>
            <p className="text-xs text-[rgb(--muted)]">Monitoring</p>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Facilities</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/carbon/facilities">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {facilitiesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : facilitiesQuery.data?.length ? (
            <ul className="space-y-2">
              {facilitiesQuery.data.map((f: any) => (
                <li key={f.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{f.facilityType}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No facilities yet</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Projects</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/carbon/projects">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {projectsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : projectsQuery.data?.length ? (
            <ul className="space-y-2">
              {projectsQuery.data.map((p: any) => (
                <li key={p.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">{p.status}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[rgb(var(--muted))]">
                    <div className="h-1.5 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${Math.min(100, Math.max(0, p.progressPct || 0))}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No projects yet</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Offsets</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/carbon/offsets">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {offsetsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : offsetsQuery.data?.length ? (
            <ul className="space-y-2">
              {offsetsQuery.data.map((o: any) => (
                <li key={o.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{o.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${o.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : o.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{o.verificationStatus}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{o.creditsPurchased} credits</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No offsets yet</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/carbon/facilities"><PlusCircle className="mr-2 h-4 w-4" />New Facility</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/carbon/emission-sources"><PlusCircle className="mr-2 h-4 w-4" />New Emission Source</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/carbon/projects"><PlusCircle className="mr-2 h-4 w-4" />New Project</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/carbon/offsets"><PlusCircle className="mr-2 h-4 w-4" />New Offset</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/carbon/calculator"><Zap className="mr-2 h-4 w-4" />Calculator</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}