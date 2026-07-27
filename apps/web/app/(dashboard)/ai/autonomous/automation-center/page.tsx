'use client';

import { useMemo, useState } from 'react';
import { Bot } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useAutomationStats, useActions, useRunAutomation } from '@/modules/autonomous/hooks.js';

const QUICK_TRIGGERS = [
  { triggerType: 'capa_create', label: 'Draft CAPA', description: 'Create a new CAPA from last audit finding' },
  { triggerType: 'audit_plan', label: 'Generate Audit Plan', description: 'Generate quarterly audit plan' },
  { triggerType: 'training_assign', label: 'Assign Training', description: 'Assign overdue training modules' },
  { triggerType: 'supplier_audit', label: 'Supplier Check', description: 'Run supplier compliance check' },
  { triggerType: 'notification_send', label: 'Send Report', description: 'Send monthly compliance report' },
];

export default function AutomationCenterPage() {
  const { data: stats } = useAutomationStats();
  const { data: actionsData } = useActions({ limit: 10 });
  const runAutomation = useRunAutomation();
  const [running, setRunning] = useState<string | null>(null);

  const summary = useMemo(() => {
    const items = [
      { label: 'Total Actions', value: String(stats?.totalActions ?? 0) },
      { label: 'Pending Approval', value: String(stats?.pendingApproval ?? 0) },
      { label: 'Completed Jobs', value: String(stats?.completedJobs ?? 0) },
      { label: 'Failed Jobs', value: String(stats?.failedJobs ?? 0) },
    ];
    return items;
  }, [stats]);

  const items = (actionsData?.actions ?? []) as any[];

  async function handleRun(triggerType: string) {
    setRunning(triggerType);
    try {
      await runAutomation.mutateAsync({ triggerType, context: {} });
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Automation Center</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Overview of AI automation performance, recent actions, and quick triggers.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_TRIGGERS.map((qt) => (
            <Card key={qt.triggerType} className="flex items-start gap-3 p-4">
              <Bot className="mt-0.5 h-5 w-5 text-[rgb(var(--primary))]" />
              <div className="flex-1">
                <p className="text-sm font-medium">{qt.label}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{qt.description}</p>
              </div>
              <button
                onClick={() => handleRun(qt.triggerType)}
                disabled={running === qt.triggerType}
                className="rounded-md border border-[rgb(var(--border-color))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel-2))] disabled:opacity-50"
              >
                {running === qt.triggerType ? 'Running…' : 'Run'}
              </button>
            </Card>
          ))}
        </div>
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
                <th className="px-4 py-2 text-left">Confidence</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No recent actions available.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{item.title}</td>
                    <td className="px-4 py-2 text-xs">{item.actionType}</td>
                    <td className="px-4 py-2 text-xs">{item.priority}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{Math.round(item.confidenceScore)}%</td>
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
