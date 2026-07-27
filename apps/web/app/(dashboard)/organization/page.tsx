'use client';

import { useMemo, useState } from 'react';
import { Building2, Users, FileCheck2, ClipboardList, Activity } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { BarChart, LineChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';
import { useCaseAnalytics, useKpis, useTrends } from '@/modules/analytics/store.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

interface OrgUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status?: string;
}
interface CaseActivity {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
}
interface RecentCase {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  createdAt: string;
}

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `?${q}` : '';
}

export default function OrganizationDashboardPage() {
  const { session } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: users, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['org-users'],
    queryFn: () => http<OrgUser[]>('/api/v1/users'),
  });

  const { data: cases, isLoading: casesLoading, isError: casesError, refetch: refetchCases } = useQuery({
    queryKey: ['org-cases', from, to],
    queryFn: () => http<{ cases: RecentCase[]; total: number }>(`/api/v1/cases${qs({ limit: '50', offset: '0', dateFrom: from, dateTo: to })}`),
  });

  const { data: activities, isLoading: actLoading, isError: actError, refetch: refetchAct } = useQuery({
    queryKey: ['org-activity'],
    queryFn: () => http<CaseActivity[]>('/api/v1/cases/activity'),
  });

  const { data: assessments } = useQuery({
    queryKey: ['org-assessments'],
    queryFn: () => http<{ data: unknown[]; total: number }>('/api/v1/assessments'),
  });

  const { data: audits } = useQuery({
    queryKey: ['org-audits'],
    queryFn: () => http<unknown[]>('/api/v1/audits'),
  });

  const { data: kpis } = useKpis({ dateFrom: from, dateTo: to });
  const { data: caseAnalytics } = useCaseAnalytics({ dateFrom: from, dateTo: to });
  const { data: trends } = useTrends('cases', 'month');

  const stats = useMemo(
    () => [
      { label: 'Total Users', value: users?.length ?? 0, icon: Users },
      { label: 'Total Cases', value: cases?.total ?? kpis?.totalCases ?? 0, icon: ClipboardList },
      { label: 'Total Assessments', value: assessments?.total ?? 0, icon: FileCheck2 },
      { label: 'Total Audits', value: audits?.length ?? 0, icon: Activity },
    ],
    [users, cases, kpis, assessments, audits],
  );

  const statusBars = useMemo(() => {
    const by = caseAnalytics?.byStatus ?? {};
    return Object.entries(by).map(([label, value]) => ({ label, value }));
  }, [caseAnalytics]);

  const trendPoints = useMemo(() => (trends ?? []).map((t) => ({ label: t.period, value: t.count })), [trends]);

  const loading = usersLoading || casesLoading || actLoading;
  const isError = usersError || casesError || actError;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Building2 className="h-6 w-6 text-[rgb(var(--primary))]" />
            {session?.organization.name ?? 'Organization'} Dashboard
          </h1>
          <p className="text-sm text-[rgb(var(--muted))]">Consolidated view of users, cases, assessments and audits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isError ? (
        <ErrorState title="Failed to load organization data" message="We couldn't reach the API. Please try again." onRetry={() => { refetchUsers(); refetchCases(); refetchAct(); }} />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <StatTile key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Cases by Status</h2>
          {statusBars.length ? <BarChart data={statusBars} /> : <EmptyState title="No case data" description="No cases were found in the selected period." />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Case Volume Trend</h2>
          {trendPoints.length ? <LineChart data={trendPoints} /> : <EmptyState title="No trend data" description="Trend data is not available yet." />}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent Activity</h2>
        {actLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !activities || activities.length === 0 ? (
          <EmptyState title="No recent activity" description="Activity will appear here as cases are processed." />
        ) : (
          <ul className="divide-y divide-[rgb(var(--border-color))]">
            {activities.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{a.activityType.replace(/_/g, ' ')}</span>
                  <span className="ml-2 text-[rgb(var(--muted))]">{a.description}</span>
                </span>
                <span className="shrink-0 text-xs text-[rgb(var(--muted))]">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
