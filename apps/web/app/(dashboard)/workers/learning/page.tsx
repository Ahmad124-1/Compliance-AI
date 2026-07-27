'use client';

import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

import { Card, Field, Input, Skeleton, EmptyState, DataTable, type Column, Dialog, Button } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useLearning, useWorkerPlatformUiStore } from '@/modules/worker-platform/store.js';
import { LEARNING_STATUS_LABELS, LEARNING_TYPE_LABELS } from '@/modules/worker-platform/constants.js';
import type { WorkerLearning } from '@/modules/worker-platform/types.js';

export default function LearningPage() {
  const { toast } = useToast();
  const { data: learning, isLoading, error, refetch } = useLearning();
  const { filterTaskType, setFilterTaskType } = useWorkerPlatformUiStore();
  const [progressOpen, setProgressOpen] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState(50);

  const filtered = (learning ?? []).filter((l) => !filterTaskType || l.learningType === filterTaskType);

  const columns: Column<WorkerLearning>[] = [
    { key: 'courseTitle', header: 'Course', render: (r) => <span className="font-medium">{r.courseTitle}</span> },
    { key: 'type', header: 'Type', render: (r) => <span className="text-xs text-[rgb(var(--muted))]">{LEARNING_TYPE_LABELS[r.learningType] ?? r.learningType}</span> },
    { key: 'status', header: 'Status', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === 'completed' || r.status === 'certified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{LEARNING_STATUS_LABELS[r.status] ?? r.status}</span> },
    { key: 'progress', header: 'Progress', render: (r) => <div className="w-full"><div className="h-2 rounded bg-[rgb(var(--panel-2))]"><div className="h-2 rounded bg-[rgb(var(--primary))]" style={{ width: `${r.progress}%` }} /></div><span className="text-xs text-[rgb(var(--muted))]">{r.progress}%</span></div> },
    { key: 'actions', header: '', render: (r) => r.status !== 'completed' && r.status !== 'certified' ? <Button size="sm" variant="ghost" onClick={() => { setProgressOpen(r.id); setProgressVal(r.progress); }}>Update</Button> : null },
  ];

  if (error) return <div className="p-4 text-red-500">Failed to load learning.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Learning Center</h1>
      <Card className="p-4">
        <select value={filterTaskType} onChange={(e) => setFilterTaskType(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-48">
          <option value="">All types</option>
          {Object.entries(LEARNING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Card>
      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No learning items yet." rowKey={(r) => r.id} />
      )}

      <Dialog open={!!progressOpen} onClose={() => setProgressOpen(null)} title="Update Progress" description="Mark your learning as complete or update progress." size="md" footer={<Button onClick={() => setProgressOpen(null)}>Close</Button>}>
        {progressOpen && (
          <div className="flex flex-col gap-3">
            <Field label="Progress (0-100)"><Input type="number" min="0" max="100" value={progressVal} onChange={(e) => setProgressVal(Number(e.target.value))} /></Field>
            <Button onClick={() => { toast({ title: 'Progress updated', variant: 'success' }); setProgressOpen(null); }}>Save</Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
