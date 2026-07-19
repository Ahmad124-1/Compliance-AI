'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import {
  useOrganizations,
  useCreateOrganization,
} from '@/modules/tenants/module.store.js';
import { createOrganizationSchema, type CreateOrganizationInput } from '@/modules/tenants/module.validation.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function OrganizationsPage() {
  const { data: orgs, isLoading } = useOrganizations();
  const create = useCreateOrganization();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationInput>({ resolver: zodResolver(createOrganizationSchema) });

  const onSubmit = async (data: CreateOrganizationInput) => {
    await create.mutateAsync(data);
    reset();
    setOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        {hasPermission('org:create') && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            New organization
          </Button>
        )}
      </div>

      {open && hasPermission('org:create') && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Field label="Name" error={errors.name?.message}>
              <Input {...register('name')} />
            </Field>
            <Field label="Kind">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('kind')}>
                <option value="client">client</option>
                <option value="consultancy">consultancy</option>
              </select>
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                Create
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {orgs?.map((o) => (
          <Card key={o.id} className="p-4">
            <p className="text-sm font-medium">{o.name}</p>
            <p className="text-xs text-[rgb(var(--muted))]">/{o.slug} · {o.kind}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
