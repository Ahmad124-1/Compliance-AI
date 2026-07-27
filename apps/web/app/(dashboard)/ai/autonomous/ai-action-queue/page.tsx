'use client';

import { useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useActions, useApproveAction, useRejectAction, useAutomationStats } from '@/modules/autonomous/hooks.js';

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

export default function AIActionQueuePage() {
  const { data: stats } = useAutomationStats();
  const { data: actionsData } = useActions({ limit: 50 });
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();
  const [filter, setFilter] = useState<string>('pending');

  const items = useMemo(() => (actionsData?.actions ?? []) as any[], [actionsData]);
  const filtered = useMemo(() => items.filter((a) => a.status === filter), [items, filter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Action Queue</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Review, approve, or reject AI-recommended actions before execution.</p>
      </div>

      <section className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1 text-xs"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="executing">Executing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Pending Approval</p><p className="mt-1 text-lg font-semibold">{stats?.pendingApproval ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Completed</p><p className="mt-1 text-lg font-semibold">{stats?.completedJobs ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Failed</p><p className="mt-1 text-lg font-semibold">{stats?.failedJobs ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-[rgb(var(--muted))]">Total Actions</p><p className="mt-1 text-lg font-semibold">{stats?.totalActions ?? 0}</p></Card>
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-color))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Confidence</th>
                <th className="px-4 py-2 text-left">Assigned To</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No actions found.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{item.title}</td>
                    <td className="px-4 py-2 text-xs">{item.actionType}</td>
                    <td className="px-4 py-2 text-xs">{item.priority}</td>
                    <td className="px-4 py-2"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-2 text-right">{Math.round(item.confidenceScore)}%</td>
                    <td className="px-4 py-2 text-xs">{item.assignedTo ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      {item.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approveAction.mutate({ actionId: item.id, decision: 'Approve', comments: 'Approved from queue' })}
                            disabled={approveAction.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-[rgb(var(--border-color))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel-2))] disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => rejectAction.mutate({ actionId: item.id, reason: 'Rejected from queue' })}
                            disabled={rejectAction.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-[rgb(var(--border-color))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel-2))] disabled:opacity-50"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
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
