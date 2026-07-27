'use client';

import { useMemo } from 'react';
import { Network, Layers, ClipboardList, CheckCircle2 } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { BarChart, DonutChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';

const http = createHttpClient(() => tokenStorage.getAccessToken());

interface Department {
  id: string;
  siteId: string | null;
  name: string;
  code: string | null;
}
interface Team {
  id: string;
  departmentId: string | null;
  name: string;
}
interface CaseLike {
  id: string;
  departmentId: string | null;
  status: string;
  title: string;
  caseNumber: string;
}
interface AssessmentLike {
  id: string;
  departmentId: string | null;
  status: string;
}

export default function DepartmentDashboardPage() {
  const { session: _session } = useAuth();

  const { data: departments, isLoading: dLoading, isError: dError, refetch: refetchD } = useQuery({
    queryKey: ['dept-list'],
    queryFn: () => http<Department[]>('/api/v1/tenants/departments'),
  });
  const { data: teams } = useQuery({
    queryKey: ['dept-teams'],
    queryFn: () => http<Team[]>('/api/v1/tenants/teams'),
  });
  const { data: casesRes, isLoading: cLoading } = useQuery({
    queryKey: ['dept-cases'],
    queryFn: () => http<{ cases: CaseLike[]; total: number }>('/api/v1/cases'),
  });
  const { data: assessments } = useQuery({
    queryKey: ['dept-assessments'],
    queryFn: () => http<{ data: AssessmentLike[]; total: number }>('/api/v1/assessments'),
  });

  const cases = useMemo(() => casesRes?.cases ?? [], [casesRes]);
  const assessmentList = useMemo(() => assessments?.data ?? [], [assessments]);

  const casesByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cases) {
      const key = c.departmentId ?? 'unassigned';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return departments?.map((d) => ({ label: d.name, value: map.get(d.id) ?? 0 })) ?? [];
  }, [cases, departments]);

  const teamsByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of teams ?? []) {
      if (!t.departmentId) continue;
      map.set(t.departmentId, (map.get(t.departmentId) ?? 0) + 1);
    }
    return departments?.map((d) => ({ id: d.id, name: d.name, teams: map.get(d.id) ?? 0 })) ?? [];
  }, [teams, departments]);

  const coverageByDept = useMemo(() => {
    const totalDepts = departments?.length ?? 0;
    const assessedDepts = new Set(assessmentList.map((a) => a.departmentId).filter(Boolean)).size;
    return [
      { label: 'Covered', value: assessedDepts },
      { label: 'Not Covered', value: Math.max(totalDepts - assessedDepts, 0) },
    ];
  }, [assessmentList, departments]);

  const openCases = cases.filter((c) => !['resolved', 'closed', 'archived'].includes(c.status)).length;

  const loading = dLoading || cLoading;
  const isError = dError;

  if (isError) return <ErrorState title="Failed to load department data" message="Could not reach the departments API." onRetry={() => refetchD()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Network className="h-6 w-6 text-[rgb(var(--primary))]" />
          Department Dashboard
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Case volume, team coverage and assessment reach per department.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Departments" value={departments?.length ?? 0} />
          <StatTile label="Teams" value={teams?.length ?? 0} />
          <StatTile label="Open Cases" value={openCases} />
          <StatTile label="Assessments" value={assessmentList.length} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Cases by Department</h2>
          {loading ? <Skeleton className="h-48" /> : casesByDept.length ? <BarChart data={casesByDept} /> : <EmptyState title="No departments" description="No departments or cases found." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4 text-[rgb(var(--primary))]" />
            Teams per Department
          </h2>
          {loading ? <Skeleton className="h-48" /> : teamsByDept.length ? (
            <div className="space-y-2">
              {teamsByDept.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="font-semibold">{d.teams}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No teams" description="Teams per department will appear here." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-[rgb(var(--primary))]" />
            Assessment Coverage
          </h2>
          {loading ? <Skeleton className="h-48" /> : coverageByDept.some((d) => d.value > 0) ? <DonutChart data={coverageByDept} /> : <EmptyState title="No assessment data" description="Assessment coverage will appear here." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-[rgb(var(--primary))]" />
            Department Summary
          </h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : departments && departments.length ? (
            <ul className="divide-y divide-[rgb(var(--border-color))]">
              {departments.map((d) => {
                const cCount = cases.filter((c) => c.departmentId === d.id).length;
                const tCount = (teams ?? []).filter((t) => t.departmentId === d.id).length;
                return (
                  <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">{cCount} cases · {tCount} teams</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No departments" description="Departments will be listed here." />
          )}
        </Card>
      </div>
    </div>
  );
}
