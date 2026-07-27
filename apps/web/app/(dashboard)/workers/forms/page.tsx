'use client';

import { useState } from 'react';
import { FileCheck } from 'lucide-react';

import { Button, Card, Field, Input, Textarea, Skeleton, EmptyState, DataTable, type Column, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useForms, useSubmitForm, useWorkerPlatformUiStore } from '@/modules/worker-platform/store.js';
import { FORM_STATUS_LABELS, FORM_TYPE_LABELS } from '@/modules/worker-platform/constants.js';
import type { WorkerForm } from '@/modules/worker-platform/types.js';

export default function FormsPage() {
  const { toast } = useToast();
  const { data: forms, isLoading, error, refetch } = useForms();
  const submit = useSubmitForm();
  const { filterFormStatus, setFilterFormStatus } = useWorkerPlatformUiStore();
  const [composeOpen, setComposeOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('general');

  const filtered = (forms ?? []).filter((f) => !filterFormStatus || f.status === filterFormStatus);

  const columns: Column<WorkerForm>[] = [
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'type', header: 'Type', render: (r) => <span className="text-xs text-[rgb(var(--muted))]">{FORM_TYPE_LABELS[r.formType] ?? r.formType}</span> },
    { key: 'status', header: 'Status', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{FORM_STATUS_LABELS[r.status] ?? r.status}</span> },
    { key: 'date', header: 'Submitted', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (error) return <div className="p-4 text-red-500">Failed to load forms.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Forms</h1>
        <Button size="sm" onClick={() => setComposeOpen(true)}><FileCheck className="h-4 w-4 mr-1" /> Submit Form</Button>
      </div>

      <Card className="p-4">
        <select value={filterFormStatus} onChange={(e) => setFilterFormStatus(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-48">
          <option value="">All statuses</option>
          {Object.entries(FORM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Card>

      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No forms submitted yet." rowKey={(r) => r.id} />
      )}

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} title="Submit Form" description="Submit a new request to HR or management." size="md" footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button onClick={() => { submit.mutateAsync({ formType, title: formTitle }).then(() => { toast({ title: 'Form submitted', variant: 'success' }); setComposeOpen(false); setFormTitle(''); }); }}>Submit</Button>
        </div>
      }>
        <div className="flex flex-col gap-3">
          <Field label="Form Type">
            <select value={formType} onChange={(e) => setFormType(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm">
              {Object.entries(FORM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Title"><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} /></Field>
        </div>
      </Dialog>
    </div>
  );
}
