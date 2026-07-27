'use client';

import { useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useActions, useAutomationStats } from '@/modules/autonomous/hooks.js';

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
    status === 'approved' ? 'bg-blue-100 text-blue-700' :
    status === 'rejected' ? 'bg-red-100 text-red-700' :
    status === 'executing' ? 'bg-purple-100 text-purple-700' :
    status === 'completed' ? 'bg-green-100 text-green-700' :
    status === 'failed' ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
}

export default function CAPAAutomationPage() {
  const { data: stats } = useAutomationStats();
  const { data: actionsData } = useActions();

  const items = useMemo(() => (actionsData?.actions ?? []).filter((a: any) => a.actionType === 'capa_create'), [actionsData]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-6 w-6 text-[rgb(var(--primary))]" />
        <div>
          <h1 className="text-2xl font-semibold">CAPA Automation</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Auto-draft CAPAs, assign owners, and track completion status.</p>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Completed Jobs</p><p className="mt-1 text-lg font-semibold">{stats?.completedJobs ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Failed Jobs</p><p className="mt-1 text-lg font-semibold">{stats?.failedJobs ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Pending Approval</p><p className="mt-1 text-lg font-semibold">{stats?.pendingApproval ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Total Actions</p><p className="mt-1 text-lg font-semibold">{stats?.totalActions ?? 0}</p></Card>
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-color))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Confidence</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No CAPA automation actions available.</td></tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{item.title}</td>
                    <td className="px-4 py-2 text-xs">{item.priority}</td>
                    <td className="px-4 py-2"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-2 text-right">{Math.round(item.confidenceScore)}%</td>
                    <td className="px-4 py-2 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
