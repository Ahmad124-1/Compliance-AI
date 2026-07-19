'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useQrPortals, useCreateQrPortal } from '@/modules/grievances/module.store.js';
import { qrPortalCreateSchema } from '@/modules/grievances/module.validation.js';
import type { QrPortalCreateInput } from '@/modules/grievances/module.types.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function AdminQrPortalsPage() {
  const { data: portals, isLoading } = useQrPortals();
  const create = useCreateQrPortal();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QrPortalCreateInput>({
    resolver: zodResolver(qrPortalCreateSchema),
    defaultValues: { organizationId: session?.organization.id ?? '', configuration: {} },
  });

  const onSubmit = async (data: QrPortalCreateInput) => {
    await create.mutateAsync(data);
    reset();
    setOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">QR Portals</h1>
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          New QR Portal
        </Button>
      </div>

      {open && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Field label="Portal URL" error={errors.portalUrl?.message}>
              <Input {...register('portalUrl')} placeholder="https://..." />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Create
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {portals?.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{p.portalUrl}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{new Date(p.createdAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {p.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
        {portals?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No QR portals yet.</p>}
      </Card>
    </div>
  );
}
