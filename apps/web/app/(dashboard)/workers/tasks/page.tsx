'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

import { Button, Card, Field, Input, Textarea, Skeleton, EmptyState, DataTable, type Column, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useTasks, useCompleteTask, useWorkerPlatformUiStore } from '@/modules/worker-platform/store.js';
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/modules/worker-platform/constants.js';
import type { WorkerTask } from '@/modules/worker-platform/types.js';

export default function TasksPage() {
  const { toast } = useToast();
  const { data: tasks, isLoading, error, refetch } = useTasks();
  const complete = useCompleteTask();
  const { filterTaskStatus, setFilterTaskStatus } = useWorkerPlatformUiStore();
  const [composeOpen, setComposeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const filtered = (tasks ?? []).filter((t) => !filterTaskStatus || t.status === filterTaskStatus);

  const columns: Column<WorkerTask>[] = [
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'type', header: 'Type', render: (r) => TASK_TYPE_LABELS[r.taskType] ?? r.taskType },
    { key: 'priority', header: 'Priority', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.priority === 'critical' ? 'bg-red-100 text-red-700' : r.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{r.priority}</span> },
    { key: 'status', header: 'Status', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{TASK_STATUS_LABELS[r.status] ?? r.status}</span> },
    { key: 'due', header: 'Due', render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
    { key: 'actions', header: '', render: (r) => r.status !== 'completed' && r.status !== 'cancelled' ? <Button size="sm" variant="ghost" onClick={() => complete.mutateAsync(r.id).then(() => toast({ title: 'Task completed', variant: 'success' })).catch(() => toast({ title: 'Failed', variant: 'error' }))}>Complete</Button> : null },
  ];

  if (error) return <div className="p-4 text-red-500">Failed to load tasks.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <Button size="sm" onClick={() => setComposeOpen(true)}><Send className="h-4 w-4 mr-1" /> New Task</Button>
      </div>

      <Card className="p-4">
        <select value={filterTaskStatus} onChange={(e) => setFilterTaskStatus(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-48">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No tasks yet." rowKey={(r) => r.id} />
      )}

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} title="New Task" description="Create a new task for yourself." size="md" footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setComposeOpen(false); setNewTitle(''); }}>Cancel</Button>
          <Button onClick={() => { toast({ title: 'Task created', variant: 'success' }); setComposeOpen(false); setNewTitle(''); }}>Save</Button>
        </div>
      }>
        <Field label="Title"><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></Field>
      </Dialog>
    </div>
  );
}
