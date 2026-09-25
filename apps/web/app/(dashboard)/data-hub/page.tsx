'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2, MapPin, Users, Truck, Recycle, Target, TrendingUp, FileText,
  ArrowRight, Upload, ClipboardCheck, Layers, Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { StatTile } from '@/components/ui/charts';
import { dataHubService } from '@/modules/data-hub/service.js';

export default function DataHubDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['data-hub', 'dashboard'],
    queryFn: () => dataHubService.getDashboard(),
  });
  const queueQuery = useQuery({
    queryKey: ['data-hub', 'queue'],
    queryFn: () => dataHubService.getQueue(),
  });
  const syncStatusQuery = useQuery({
    queryKey: ['data-hub', 'sync', 'status'],
    queryFn: () => dataHubService.syncStatus(),
  });

  const d = dashboardQuery.data;
  const counts = d?.counts;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Hub</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Centralized Sustainability Workspace — single source of truth for all modules.
          {d?.organization ? ` Organization: ${d.organization.name}` : ''}
        </p>
      </div>

      {dashboardQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : dashboardQuery.isError ? (
        <ErrorState title="Failed to load Data Hub" onRetry={() => dashboardQuery.refetch()} />
      ) : d ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile label="Facilities" value={counts?.facilities ?? 0} />
          <StatTile label="Sites" value={counts?.sites ?? 0} />
          <StatTile label="Departments" value={counts?.departments ?? 0} />
          <StatTile label="Suppliers" value={counts?.suppliers ?? 0} />
          <StatTile label="Programs" value={counts?.programs ?? 0} />
          <StatTile label="Goals" value={counts?.goals ?? 0} />
          <StatTile label="KPIs" value={counts?.kpis ?? 0} />
          <StatTile label="Documents" value={counts?.documents ?? 0} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Validation Queue</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/data-hub/validation">Review <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <p className="text-3xl font-semibold">{d?.pendingValidation ?? 0}</p>
          <p className="text-xs text-[rgb(var(--muted))]">pending records awaiting approval</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Processing Queue</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/data-hub/queue">View <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <p className="text-3xl font-semibold">{d?.activeImports ?? 0}</p>
          <p className="text-xs text-[rgb(var(--muted))]">active import jobs</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Master Data</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/data-hub/master-data">Open <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">Facilities, sites, departments, suppliers, programs, goals, KPIs, reporting periods, emission factors, standards & frameworks — reused across all modules.</p>
        </Card>
      </div>

      {syncStatusQuery.data?.length ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Synchronization Status</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/data-hub/master-data">Master Data <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {syncStatusQuery.data.map((s) => (
              <div key={s.entityType} className="flex items-center justify-between rounded-md bg-[rgb(var(--panel-2))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{s.entityLabel}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {s.lastSyncedAt ? `Synced ${new Date(s.lastSyncedAt).toLocaleString()}` : 'Never synced'}
                  </p>
                </div>
                <span className="rounded bg-[rgb(var(--primary))] px-2 py-0.5 text-xs font-medium text-[rgb(var(--primary-foreground))]">
                  {s.totalRecords}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/data-hub/timeline">Timeline <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {d?.recentActivity?.length ? (
            <ul className="space-y-2">
              {d.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-medium">{a.action}</span>
                    {a.entityName ? <span className="text-[rgb(var(--muted))]"> — {a.entityName}</span> : null}
                  </span>
                  <span className="text-xs text-[rgb(var(--muted))]">{new Date(a.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No activity yet</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Queue Status</h2>
          {queueQuery.data?.counts?.length ? (
            <div className="space-y-2">
              {queueQuery.data.counts.map((c) => (
                <div key={c.status} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{c.status}</span>
                  <span className="rounded bg-[rgb(var(--panel-2))] px-2 py-0.5 font-medium">{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No queue activity</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/data-hub/imports"><Upload className="mr-2 h-4 w-4" />New Import</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/data-hub/documents"><FileText className="mr-2 h-4 w-4" />Upload Document</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/data-hub/validation"><ClipboardCheck className="mr-2 h-4 w-4" />Validation Queue</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/data-hub/queue"><Layers className="mr-2 h-4 w-4" />Processing Queue</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/data-hub/timeline"><Activity className="mr-2 h-4 w-4" />Activity Timeline</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}