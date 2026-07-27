'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { useWorkerProfile, useTasks, useAnnouncements, useDocuments, useForms, useLearning } from '@/modules/worker-platform/store.js';
import { TASK_STATUS_LABELS } from '@/modules/worker-platform/constants.js';
import { WORKER_ROUTES } from '@/modules/worker-platform/constants.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useToast } from '@/providers/ToastProvider.js';

export default function OverviewPage() {
  const { session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useWorkerProfile();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: forms, isLoading: formsLoading } = useForms();
  const { data: learning, isLoading: learningLoading } = useLearning();

  const pendingTasks = useMemo(() => (tasks ?? []).filter((t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue').length, [tasks]);
  const unreadAnnouncements = useMemo(() => (announcements?.announcements ?? []).filter((a) => a.pinned).length, [announcements]);
  const upcomingTraining = useMemo(() => (learning ?? []).filter((l) => l.status === 'not_started' || l.status === 'in_progress').length, [learning]);
  const openForms = useMemo(() => (forms ?? []).filter((f) => f.status === 'pending' || f.status === 'in_review').length, [forms]);

  const quickActions = [
    { label: 'Request Leave', href: WORKER_ROUTES.forms, icon: 'FileCheck' },
    { label: 'Browse Learning', href: WORKER_ROUTES.learning, icon: 'GraduationCap' },
    { label: 'View Directory', href: WORKER_ROUTES.directory, icon: 'Users' },
    { label: 'Get Support', href: WORKER_ROUTES.support, icon: 'HelpCircle' },
  ];

  if (profileLoading || tasksLoading || announcementsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{profile?.firstName ? `, ${profile.firstName}` : ''}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {session?.organization.name} · {profile?.position ?? 'Worker'} · {profile?.departmentId ?? ''}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pending Tasks" value={String(pendingTasks)} />
        <StatTile label="Pinned Announcements" value={String(unreadAnnouncements)} />
        <StatTile label="Upcoming Training" value={String(upcomingTraining)} />
        <StatTile label="Open Forms" value={String(openForms)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Profile Summary</h2>
          <div className="space-y-2 text-sm">
            <Row label="Name" value={`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`} />
            <Row label="Email" value={profile?.email} />
            <Row label="Position" value={profile?.position ?? '—'} />
            <Row label="Employee ID" value={profile?.employeeId ?? '—'} />
            <Row label="Languages" value={profile?.languages?.join(', ') || '—'} />
            <Row label="Skills" value={profile?.skills?.join(', ') || '—'} />
          </div>
          <Link href={WORKER_ROUTES.profile}>
            <button className="mt-3 text-sm text-[rgb(var(--primary))] hover:underline">Edit Profile</button>
          </Link>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Recent Tasks</h2>
          <div className="space-y-2">
            {(tasks ?? []).slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-2">
                <div>
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{t.taskType} · {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === 'completed' ? 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>{TASK_STATUS_LABELS[t.status] ?? t.status}</span>
              </div>
            ))}
            {(tasks ?? []).length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No tasks yet.</p>}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                <p className="text-sm font-medium">{a.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}
