'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useAssessmentDashboard, useAssessments, useLibrary } from '@/modules/assessments/module.store.js';

export default function DashboardHome() {
  const { session, hasPermission } = useAuth();
  const user = session?.user;

  const { data: dash } = useAssessmentDashboard();
  const { data: recentAssessments } = useAssessments({ limit: 5 });
  const { data: libraryItems } = useLibrary({ limit: 5 });

  const statCards = useMemo(() => {
    const items = [
      { label: 'Published templates', value: String(dash?.publishedTemplates ?? '—') },
      { label: 'Total templates', value: String(dash?.totalTemplates ?? '—') },
      { label: 'Total assessments', value: String(dash?.totalAssessments ?? '—') },
      { label: 'Active assessments', value: String(dash?.activeAssessments ?? '—') },
    ];
    return items;
  }, [dash]);

  const adminCards = [
    { label: 'Users', href: '/admin/users', perm: 'user:read' },
    { label: 'Organizations', href: '/admin/organizations', perm: 'org:read' },
    { label: 'Sites / Factories', href: '/admin/sites', perm: 'site:read' },
    { label: 'Roles & Permissions', href: '/admin/roles', perm: 'role:read' },
    { label: 'Grievances', href: '/admin/grievances', perm: 'grievance:read' },
    { label: 'Cases', href: '/admin/cases', perm: 'case:read' },
  ].filter((c) => hasPermission(c.perm));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{user?.firstName ? `, ${user.firstName}` : ''}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {session?.organization.name} · roles: {session?.roles.join(', ') || '—'}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-[rgb(var(--muted))]">{c.label}</p>
            <p className="text-2xl font-semibold">{c.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Recent assessments</h2>
          <div className="space-y-2">
            {recentAssessments?.data?.map((a: any) => (
              <Link key={a.id} href={`/assessments/${a.id}`} className="block text-sm hover:underline">
                {a.title ?? a.id}
              </Link>
            ))}
            {(!recentAssessments?.data || recentAssessments.data.length === 0) && <p className="text-sm text-[rgb(var(--muted))]">No assessments yet.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Library preview</h2>
          <div className="space-y-2">
            {libraryItems?.data?.map((t: any) => (
              <Link key={t.id} href={`/assessments/library/${t.id}`} className="block text-sm hover:underline">
                {t.title} · {t.status}
              </Link>
            ))}
            {(!libraryItems?.data || libraryItems.data.length === 0) && <p className="text-sm text-[rgb(var(--muted))]">No templates in library.</p>}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Administration</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {adminCards.map((c) => (
            <Link key={c.href} href={c.href}>
              <Card className="p-5 transition-colors hover:bg-[rgb(var(--panel-2))]">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-[rgb(var(--muted))]">Manage {c.label.toLowerCase()}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
