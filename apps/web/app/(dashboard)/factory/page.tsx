'use client';

import { useMemo } from 'react';
import { Factory, Building, Users2, MessageSquareHeart } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { BarChart, DonutChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';

const http = createHttpClient(() => tokenStorage.getAccessToken());

interface Site {
  id: string;
  name: string;
  code: string | null;
}
interface Department {
  id: string;
  siteId: string | null;
  name: string;
}
interface CaseLike {
  id: string;
  factoryId: string | null;
  status: string;
  title: string;
  caseNumber: string;
}
interface StatusUpdate {
  id: string;
  caseId: string;
  channel?: string;
}

export default function FactoryDashboardPage() {
  const { session: _session } = useAuth();

  const { data: sites, isLoading: sLoading, isError: sError, refetch: refetchS } = useQuery({
    queryKey: ['factory-sites'],
    queryFn: () => http<Site[]>('/api/v1/tenants/sites'),
  });
  const { data: departments } = useQuery({
    queryKey: ['factory-departments'],
    queryFn: () => http<Department[]>('/api/v1/tenants/departments'),
  });
  const { data: casesRes, isLoading: cLoading } = useQuery({
    queryKey: ['factory-cases'],
    queryFn: () => http<{ cases: CaseLike[]; total: number }>('/api/v1/cases'),
  });
  const { data: workerVoice } = useQuery({
    queryKey: ['factory-worker-voice'],
    queryFn: () => http<StatusUpdate[]>('/api/v1/worker-communication/status-updates'),
  });

  const cases = useMemo(() => casesRes?.cases ?? [], [casesRes]);

  const casesByFactory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cases) {
      const key = c.factoryId ?? 'unassigned';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return sites?.map((s) => ({ label: s.name, value: map.get(s.id) ?? 0 })) ?? [];
  }, [cases, sites]);

  const deptsByFactory = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of departments ?? []) {
      if (!d.siteId) continue;
      map.set(d.siteId, (map.get(d.siteId) ?? 0) + 1);
    }
    return sites?.map((s) => ({ name: s.name, id: s.id, departments: map.get(s.id) ?? 0 })) ?? [];
  }, [departments, sites]);

  const voiceByFactory = useMemo(() => {
    const caseToFactory = new Map<string, string | null>();
    for (const c of cases) caseToFactory.set(c.id, c.factoryId);
    const map = new Map<string, number>();
    for (const v of workerVoice ?? []) {
      const fid = caseToFactory.get(v.caseId) ?? 'unassigned';
      map.set(fid, (map.get(fid) ?? 0) + 1);
    }
    return sites?.map((s) => ({ name: s.name, voice: map.get(s.id) ?? 0 }));
  }, [workerVoice, cases, sites]);

  const totalCases = cases.length;
  const totalDepartments = departments?.length ?? 0;
  const totalVoice = workerVoice?.length ?? 0;

  const loading = sLoading || cLoading;
  const isError = sError;

  if (isError) return <ErrorState title="Failed to load factory data" message="Could not reach the sites API." onRetry={() => refetchS()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Factory className="h-6 w-6 text-[rgb(var(--primary))]" />
          Factory Dashboard
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Site-level case volume, department coverage and worker voice.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Factories / Sites" value={sites?.length ?? 0} />
          <StatTile label="Total Cases" value={totalCases} />
          <StatTile label="Departments" value={totalDepartments} />
          <StatTile label="Worker Voice Msgs" value={totalVoice} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Cases by Factory</h2>
          {loading ? <Skeleton className="h-48" /> : casesByFactory.length ? <BarChart data={casesByFactory} /> : <EmptyState title="No factories" description="No sites or cases found." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Departments per Factory</h2>
          {loading ? <Skeleton className="h-48" /> : deptsByFactory.length ? (
            <div className="space-y-2">
              {deptsByFactory.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><Building className="h-4 w-4 text-[rgb(var(--muted))]" />{d.name}</span>
                  <span className="font-semibold">{d.departments}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No departments" description="Departments per factory will appear here." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users2 className="h-4 w-4 text-[rgb(var(--primary))]" />
            Worker Voice per Factory
          </h2>
          {loading ? <Skeleton className="h-48" /> : voiceByFactory && voiceByFactory.length ? <DonutChart data={voiceByFactory.map((v) => ({ label: v.name, value: v.voice }))} /> : <EmptyState title="No worker voice" description="Worker communication messages will appear here." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MessageSquareHeart className="h-4 w-4 text-[rgb(var(--primary))]" />
            Site Summary
          </h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : sites && sites.length ? (
            <ul className="divide-y divide-[rgb(var(--border-color))]">
              {sites.map((s) => {
                const cCount = cases.filter((c) => c.factoryId === s.id).length;
                const dCount = (departments ?? []).filter((d) => d.siteId === s.id).length;
                return (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">{cCount} cases · {dCount} depts</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No factories" description="Sites will be listed here." />
          )}
        </Card>
      </div>
    </div>
  );
}
