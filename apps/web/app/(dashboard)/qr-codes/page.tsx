'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw, Trash2, Plus, Search } from 'lucide-react';

import { Button, Card, Field, Input, Dialog, DataTable, type Column } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { QR_ROUTES, QR_TYPE_LABELS } from '@/modules/qr/constants.js';
import {
  useQrCodes,
  useQrStats,
  useCreateQrCode,
  useDeleteQrCode,
  useRegenerateQrCode,
  useQrUiStore,
} from '@/modules/qr/store.js';
import { qrCreateSchema, type QrCreateInput } from '@/modules/qr/validation.js';
import type { QrCode } from '@/modules/qr/types.js';
import { QrPreview } from '@/modules/qr/components/QrPreview.js';

export default function QrCodesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { search, typeFilter, setSearch, setTypeFilter } = useQrUiStore();
  const canCreate = hasPermission('qr:create');
  const canDelete = hasPermission('qr:delete');

  const { data: codes, isLoading } = useQrCodes(typeFilter ? { type: typeFilter } : undefined);
  const { data: stats } = useQrStats();
  const create = useCreateQrCode();
  const remove = useDeleteQrCode();
  const regenerate = useRegenerateQrCode();

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<QrCode | null>(null);

  const filtered = (codes ?? []).filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: Column<QrCode>[] = [
    {
      key: 'preview',
      header: 'Code',
      render: (row) => <QrPreview code={row.code} size={56} />,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      sortValue: (r) => r.name,
      render: (row) => (
        <div>
          <Link href={QR_ROUTES.detail(row.id)} className="font-medium text-[rgb(var(--text))] hover:underline">
            {row.name}
          </Link>
          <p className="text-xs text-[rgb(var(--muted))]">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortValue: (r) => r.type,
      render: (row) => <span className="capitalize">{QR_TYPE_LABELS[row.type] ?? row.type}</span>,
    },
    {
      key: 'scans',
      header: 'Scans',
      sortable: true,
      sortValue: (r) => r.scanCount,
      render: (row) => row.scanCount,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.isActive ? (
          <span className="rounded-full bg-[rgb(var(--success)/0.15)] px-2 py-0.5 text-xs font-medium text-[rgb(var(--success))]">Active</span>
        ) : (
          <span className="rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs font-medium text-[rgb(var(--muted))]">Inactive</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Regenerate code"
            onClick={() =>
              regenerate.mutate(row.id, {
                onSuccess: () => toast({ title: 'QR code regenerated', variant: 'success' }),
                onError: (e) => toast({ title: 'Failed to regenerate', description: String(e), variant: 'error' }),
              })
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button size="sm" variant="ghost" aria-label="Delete code" onClick={() => setConfirmDelete(row)}>
              <Trash2 className="h-4 w-4 text-[rgb(var(--danger))]" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const onSubmit = async (data: QrCreateInput) => {
    try {
      await create.mutateAsync(data);
      toast({ title: 'QR code created', variant: 'success' });
      setCreateOpen(false);
    } catch (e) {
      toast({ title: 'Failed to create QR code', description: String(e), variant: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">QR Codes</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Generate and manage scannable codes for workers to submit reports.</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New QR Code
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase text-[rgb(var(--muted))]">Total Codes</p>
          <p className="text-2xl font-semibold">{stats?.totalQrCodes ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-[rgb(var(--muted))]">Active</p>
          <p className="text-2xl font-semibold">{stats?.activeQrCodes ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-[rgb(var(--muted))]">Total Scans</p>
          <p className="text-2xl font-semibold">{stats?.totalScans ?? '—'}</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input className="pl-9" placeholder="Search by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {Object.entries(QR_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No QR codes yet. Create one to get started."
        rowKey={(r) => r.id}
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New QR Code"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="qr-create-form" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create'}</Button>
          </>
        }
      >
        <CreateForm onSubmit={onSubmit} />
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete QR code?"
        description={`This will permanently remove "${confirmDelete?.name}".`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() =>
                confirmDelete &&
                remove.mutate(confirmDelete.id, {
                  onSuccess: () => {
                    toast({ title: 'QR code deleted', variant: 'success' });
                    setConfirmDelete(null);
                  },
                  onError: (e) => toast({ title: 'Delete failed', description: String(e), variant: 'error' }),
                })
              }
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[rgb(var(--muted))]">This action cannot be undone.</p>
      </Dialog>
    </div>
  );
}

function CreateForm({ onSubmit }: { onSubmit: (data: QrCreateInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QrCreateInput>({ resolver: zodResolver(qrCreateSchema), defaultValues: { type: 'factory', isActive: true } });

  return (
    <form id="qr-create-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Field label="Name" error={errors.name?.message}>
        <Input {...register('name')} placeholder="Factory Floor A" />
      </Field>
      <Field label="Type" error={errors.type?.message}>
        <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('type')}>
          {Object.entries(QR_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Target URL" error={errors.url?.message}>
        <Input {...register('url')} placeholder="https://report.example.com/cases/new" />
      </Field>
    </form>
  );
}
