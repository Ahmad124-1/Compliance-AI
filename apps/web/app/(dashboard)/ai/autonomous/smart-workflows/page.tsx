'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { useWorkflows, useCreateWorkflow, useExecuteWorkflow } from '@/modules/autonomous/hooks.js';
import type { WorkflowDefinition } from '@/modules/autonomous/types.js';

export default function SmartWorkflowsPage() {
  const { data: workflowsData } = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const executeWorkflow = useExecuteWorkflow();

  const workflows = useMemo(() => (workflowsData ?? []) as WorkflowDefinition[], [workflowsData]);
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      await createWorkflow.mutateAsync({
        name: 'New Workflow',
        description: 'Created from Automation Center',
        category: 'general',
        steps: [],
        variables: {},
        version: '1.0.0',
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleExecute(id: string) {
    setRunningId(id);
    try {
      await executeWorkflow.mutateAsync({ id });
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Smart Workflows</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Configure and execute intelligent compliance workflows.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-1 rounded-md bg-[rgb(var(--primary))] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          {creating ? 'Creating…' : 'Create Workflow'}
        </button>
      </div>

      <section className="rounded-lg border border-[rgb(var(--border-color))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">System</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">No workflows available.</td></tr>
              ) : (
                workflows.map((wf) => (
                  <tr key={wf.id} className="border-t border-[rgb(var(--border-color))]">
                    <td className="px-4 py-2 font-medium">{wf.name}</td>
                    <td className="px-4 py-2 text-xs">{wf.category}</td>
                    <td className="px-4 py-2 text-xs">{wf.version}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wf.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {wf.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{wf.isSystem ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-xs">{new Date(wf.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleExecute(wf.id)}
                        disabled={runningId === wf.id || !wf.isActive}
                        className="rounded-md border border-[rgb(var(--border-color))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel-2))] disabled:opacity-50"
                      >
                        {runningId === wf.id ? 'Running…' : 'Execute'}
                      </button>
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
