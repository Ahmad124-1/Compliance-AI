'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, BookOpen, BarChart3, FileText, ShieldCheck, ClipboardList, Database, Target } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PILLARS, REPORT_TYPES } from '@/modules/esg/constants.js';

export default function EsgDashboardPage() {
  const [search, setSearch] = useState('');

  const frameworksQuery = useQuery({
    queryKey: ['esg', 'frameworks', { search }],
    queryFn: () => esgService.listFrameworks({ search: search || undefined }),
  });

  const periodsQuery = useQuery({
    queryKey: ['esg', 'periods'],
    queryFn: () => esgService.listPeriods({}),
  });

  const disclosuresQuery = useQuery({
    queryKey: ['esg', 'disclosures'],
    queryFn: () => esgService.listDisclosures({}),
  });

  const reportsQuery = useQuery({
    queryKey: ['esg', 'reports'],
    queryFn: () => esgService.listReports({}),
  });

  const frameworks = frameworksQuery.data?.frameworks ?? [];
  const periods = periodsQuery.data?.periods ?? [];
  const disclosures = disclosuresQuery.data?.disclosures ?? [];
  const reports = reportsQuery.data?.reports ?? [];

  const openPeriods = periods.filter((p: any) => p.status === 'open').length;
  const publishedDisclosures = disclosures.filter((d: any) => d.status === 'published').length;
  const inReviewDisclosures = disclosures.filter((d: any) => d.status === 'in_review').length;
  const publishedReports = reports.filter((r: any) => r.status === 'published').length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">ESG Reporting & Disclosure</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage frameworks, metrics, reporting periods, disclosures, and assurance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <BookOpen className="h-4 w-4" /> Frameworks
          </div>
          <p className="mt-1 text-2xl font-semibold">{frameworks.length}</p>
          <p className="text-xs text-[rgb(var(--muted))]">{frameworks.filter((f: any) => f.isActive).length} active</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <ClipboardList className="h-4 w-4" /> Open Periods
          </div>
          <p className="mt-1 text-2xl font-semibold">{openPeriods}</p>
          <p className="text-xs text-[rgb(var(--muted))]">{periods.length} total periods</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <FileText className="h-4 w-4" /> Disclosures
          </div>
          <p className="mt-1 text-2xl font-semibold">{disclosures.length}</p>
          <p className="text-xs text-[rgb(var(--muted))]">{inReviewDisclosures} in review, {publishedDisclosures} published</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <BarChart3 className="h-4 w-4" /> Reports
          </div>
          <p className="mt-1 text-2xl font-semibold">{reports.length}</p>
          <p className="text-xs text-[rgb(var(--muted))]">{publishedReports} published</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Quick Actions</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/esg/frameworks"><PlusCircle className="mr-2 h-4 w-4" />New Framework</Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/esg/metrics"><PlusCircle className="mr-2 h-4 w-4" />New Metric</Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/esg/periods"><PlusCircle className="mr-2 h-4 w-4" />New Period</Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/esg/disclosures"><PlusCircle className="mr-2 h-4 w-4" />New Disclosure</Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/esg/reports"><PlusCircle className="mr-2 h-4 w-4" />Generate Report</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pillar Breakdown</h2>
          </div>
          <div className="space-y-2">
            {PILLARS.map((pillar) => {
              const count = disclosures.filter((d: any) => d.pillar === pillar.value).length;
              return (
                <div key={pillar.value} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{pillar.label}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{count} disclosures</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Frameworks</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/esg/frameworks">View All <ShieldCheck className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
        {frameworksQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : frameworks.length ? (
          <ul className="space-y-2">
            {frameworks.slice(0, 5).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{f.name}</span>
                <span className="text-xs text-[rgb(var(--muted))]">{f.frameworkCode.toUpperCase()} v{f.version}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">No frameworks configured yet.</p>
        )}
      </Card>
    </div>
  );
}
