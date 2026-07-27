'use client';

import { useMemo, useState } from 'react';
import { History } from 'lucide-react';

import { useDecisionHistory } from '@/modules/autonomous/hooks.js';

export default function AIDecisionHistoryPage() {
  const [filter, setFilter] = useState<string>('');
  const { data: historyData } = useDecisionHistory({ decisionType: filter || undefined, limit: 100 });
  const items = useMemo(() => (historyData?.decisions ?? []) as any[], [historyData]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-[rgb(var(--primary))]" />
        <div>
          <h1 className="text-2xl font-semibold">AI Decision History</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Full audit trail of AI decisions, approvals, and rollbacks.</p>
        </div>
      </div>

      <section className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1 text-xs"
        >
          <option value="">All Decision Types</option>
          <option value="capa">CAPA</option>
          <option value="audit">Audit</option>
          <option value="supplier">Supplier</option>
          <option value="policy">Policy</option>
          <option value="training">Training</option>
          <option value="worker">Worker</option>
          <option value="general">General</option>
        </select>
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-color))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Approved</th>
                <th className="px-4 py-2 text-left">Approver</th>
                <th className="px-4 py-2 text-right">Confidence</th>
                <th className="px-4 py-2 text-left">Reasoning</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No decision history available.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{item.decisionType}</td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isApproved ? 'bg-green-100 text-green-700' : item.isApproved === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.isApproved === true ? 'Approved' : item.isApproved === false ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{item.approverId ?? '—'}</td>
                    <td className="px-4 py-2 text-right">{Math.round(item.confidenceScore)}%</td>
                    <td className="px-4 py-2 text-xs">{item.reasoning ?? '—'}</td>
                    <td className="px-4 py-2 text-xs">{new Date(item.createdAt).toLocaleString()}</td>
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
