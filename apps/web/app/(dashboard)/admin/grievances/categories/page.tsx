'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useAdminCategories, useCreateCategory } from '@/modules/grievances/module.store.js';
import { categoryCreateSchema } from '@/modules/grievances/module.validation.js';
import type { CategoryCreateInput } from '@/modules/grievances/module.types.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function AdminGrievanceCategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const create = useCreateCategory();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryCreateInput>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { organizationId: session?.organization.id ?? null },
  });

  const onSubmit = async (data: CategoryCreateInput) => {
    await create.mutateAsync(data);
    reset();
    setOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Grievance Categories</h1>
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          New category
        </Button>
      </div>

      {open && (
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
        {categories?.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{c.code}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {c.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
        {categories?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No categories yet.</p>}
      </Card>
    </div>
  );
}
