'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useStandards, useCreateStandard } from '@/modules/standards/module.store.js';
import { standardSchema, type StandardInput } from '@/modules/standards/module.validation.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function StandardsPage() {
  const { data: standards, isLoading } = useStandards();
  const create = useCreateStandard();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StandardInput>({ resolver: zodResolver(standardSchema) });

  const onSubmit = async (data: StandardInput) => {
    await create.mutateAsync(data);
    reset();
    setOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Standards</h1>
        {hasPermission('standard:create') && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            New standard
          </Button>
        )}
      </div>

      {open && hasPermission('standard:create') && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" error={errors.name?.message}>
                <Input {...register('name')} />
              </Field>
              <Field label="Code" error={errors.code?.message}>
                <Input {...register('code')} />
              </Field>
            </div>
            <Field label="Publisher">
              <Input {...register('publisher')} />
            </Field>
            <Field label="Category">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('category')}>
                <option value="">— select —</option>
                <option value="quality">Quality</option>
                <option value="environment">Environment</option>
                <option value="social">Social</option>
                <option value="energy">Energy</option>
                <option value="esg">ESG</option>
                <option value="custom">Custom</option>
              </select>
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
        {standards?.map((s) => (
          <a key={s.id} href={`/standards/${s.id}`} className="block p-4 hover:bg-[rgb(var(--panel-2))]">
            <p className="text-sm font-medium">{s.name}</p>
            <p className="text-xs text-[rgb(var(--muted))]">
              {s.code} · {s.publisher ?? '—'} · {s.category ?? '—'}
            </p>
          </a>
        ))}
        {standards?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No standards yet.</p>}
      </Card>
    </div>
  );
}
