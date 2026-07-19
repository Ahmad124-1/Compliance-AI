'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Send } from 'lucide-react';

import { Button, Card, Field, Input, Textarea, DataTable, type Column } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { UPDATE_TYPE_LABELS, RECIPIENT_LABELS } from '@/modules/worker-communication/constants.js';
import { useStatusUpdates, useSendStatusUpdate, useWorkerCommUiStore } from '@/modules/worker-communication/store.js';
import { statusUpdateSchema, type StatusUpdateInput } from '@/modules/worker-communication/validation.js';
import type { StatusUpdate } from '@/modules/worker-communication/types.js';
import { useCases } from '@/modules/cases/module.store.js';

export default function WorkerCommunicationPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { search, setSearch } = useWorkerCommUiStore();
  const { data: updates, isLoading } = useStatusUpdates();
  const { data: cases } = useCases();
  const send = useSendStatusUpdate();
  const [composeOpen, setComposeOpen] = useState(false);

  const filtered = (updates ?? []).filter((u) => !search || u.title.toLowerCase().includes(search.toLowerCase()) || u.message.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<StatusUpdate>[] = [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortValue: (r) => r.updateType,
      render: (r) => <span className="rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">{UPDATE_TYPE_LABELS[r.updateType] ?? r.updateType}</span>,
    },
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'case', header: 'Case', render: (r) => <span className="text-xs text-[rgb(var(--muted))]">{r.caseId.slice(0, 8)}</span> },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (r) => RECIPIENT_LABELS[r.recipientType] ?? r.recipientType,
    },
    {
      key: 'public',
      header: 'Visibility',
      render: (r) => (r.isPublic ? <span className="text-[rgb(var(--success))]">Public</span> : <span className="text-[rgb(var(--muted))]">Internal</span>),
    },
    { key: 'created', header: 'Sent', sortable: true, sortValue: (r) => r.createdAt, render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  const onSubmit = async (data: StatusUpdateInput) => {
    try {
      await send.mutateAsync(data);
      toast({ title: 'Message sent', variant: 'success' });
      setComposeOpen(false);
    } catch (e) {
      toast({ title: 'Failed to send', description: String(e), variant: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Worker Communication</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Public messages, status updates and conversation history with reporters.</p>
        </div>
        {hasPermission('case:update') && (
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Send className="h-4 w-4" /> New Message
          </Button>
        )}
      </div>

      <div className="mb-4">
        <Input placeholder="Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No worker messages yet." rowKey={(r) => r.id} />

      {composeOpen && (
        <ComposeSheet
          cases={(cases?.cases ?? []).map((c) => ({ id: c.id, label: `${c.caseNumber} — ${c.title}` }))}
          isPending={send.isPending}
          onSubmit={onSubmit}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </div>
  );
}

function ComposeSheet({ cases, onSubmit, onClose, isPending }: { cases: { id: string; label: string }[]; onSubmit: (d: StatusUpdateInput) => void; onClose: () => void; isPending: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusUpdateInput>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { updateType: 'public_message', recipientType: 'all', isPublic: true, isAnonymous: false, channel: 'in_app' },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg p-5">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-semibold">New Worker Message</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Field label="Case" error={errors.caseId?.message}>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('caseId')}>
              <option value="">Select a case…</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Type" error={errors.updateType?.message}>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('updateType')}>
              {Object.entries(UPDATE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Title" error={errors.title?.message}>
            <Input {...register('title')} />
          </Field>
          <Field label="Message" error={errors.message?.message}>
            <Textarea {...register('message')} rows={4} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Recipient">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('recipientType')}>
                {Object.entries(RECIPIENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Public?">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input type="checkbox" {...register('isPublic')} /> Show to reporter
              </label>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Send</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
