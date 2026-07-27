'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useWorkerVoiceDashboard, useReportConcern } from '@/modules/worker-voice/module.store.js';
import { WORKER_VOICE_CATEGORIES } from '@/modules/worker-voice/module.constants.js';
import { reportConcernSchema } from '@/modules/worker-voice/module.validation.js';
import type { ReportConcernInput } from '@/modules/worker-voice/module.validation.js';

export default function WorkerVoiceDashboardPage() {
  const router = useRouter();
  const [showReport, setShowReport] = useState(false);
  const { data: dashboard, isLoading, error, refetch } = useWorkerVoiceDashboard();
  const report = useReportConcern();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportConcernInput>({
    resolver: zodResolver(reportConcernSchema),
    defaultValues: { anonymous: true, language: 'en' },
  });

  const onSubmit = async (data: ReportConcernInput) => {
    try {
      await report.mutateAsync(data);
      reset();
      setShowReport(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-6xl"><p className="text-sm text-[rgb(var(--muted))]">Loading dashboard…</p></div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">Failed to load dashboard</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">Retry</Button>
      </div>
    );
  }

  const stats = [
    { label: 'Open Cases', value: dashboard?.openCases ?? 0, color: 'text-blue-600' },
    { label: 'Resolved Cases', value: dashboard?.resolvedCases ?? 0, color: 'text-green-600' },
    { label: 'Pending Cases', value: dashboard?.pendingCases ?? 0, color: 'text-yellow-600' },
    { label: 'Anonymous Cases', value: dashboard?.anonymousCases ?? 0, color: 'text-purple-600' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Worker Voice Dashboard</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Overview of worker concerns, cases, and ethics reporting
          </p>
        </div>
        <Button onClick={() => setShowReport((v) => !v)}>
          {showReport ? 'Cancel' : '+ Report Concern'}
        </Button>
      </div>

      {showReport && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Report a Concern</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="Title" error={errors.title?.message}>
              <Input {...register('title')} placeholder="Brief summary" />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('category')}>
                <option value="">— select —</option>
                {WORKER_VOICE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <textarea
                className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
                rows={3}
                {...register('description')}
                placeholder="Describe your concern..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" error={errors.location?.message}>
                <Input {...register('location')} placeholder="Optional" />
              </Field>
              <Field label="Department" error={errors.department?.message}>
                <Input {...register('department')} placeholder="Optional" />
              </Field>
            </div>
            <Field label="Language" error={errors.language?.message}>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('language')}>
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your Name (optional)" error={errors.reporterName?.message}>
                <Input {...register('reporterName')} placeholder="Optional" />
              </Field>
              <Field label="Email (optional)" error={errors.reporterEmail?.message}>
                <Input type="email" {...register('reporterEmail')} placeholder="Optional" />
              </Field>
            </div>
            <Field label="Phone (optional)" error={errors.reporterPhone?.message}>
              <Input {...register('reporterPhone')} placeholder="Optional" />
            </Field>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anonymous" className="h-4 w-4 rounded" {...register('anonymous')} />
              <label htmlFor="anonymous" className="text-sm text-[rgb(var(--text))]">Submit anonymously</label>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit Report'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowReport(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Category Breakdown</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Object.entries(dashboard?.categoryBreakdown ?? {}).map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-3">
              <span className="text-sm capitalize">{cat.replace(/_/g, ' ')}</span>
              <span className="text-sm font-semibold">{String(count)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Updates</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/worker-voice/my-cases')}>View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border-color))]">
                <th className="pb-2 text-left font-medium">Case</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-left font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.recentUpdates ?? []).map((u) => (
                <tr key={u.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="py-2">
                    <button onClick={() => router.push('/worker-voice/my-cases')} className="text-left hover:underline">
                      {u.caseNumber} — {u.title}
                    </button>
                  </td>
                  <td className="py-2 capitalize">{u.status.replace(/_/g, ' ')}</td>
                  <td className="py-2 text-[rgb(var(--muted))]">{new Date(u.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!dashboard?.recentUpdates || dashboard.recentUpdates.length === 0) && (
                <tr><td colSpan={3} className="py-4 text-center text-sm text-[rgb(var(--muted))]">No recent updates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
