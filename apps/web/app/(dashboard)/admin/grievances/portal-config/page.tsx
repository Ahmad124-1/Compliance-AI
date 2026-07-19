'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { usePortalConfig, useUpsertPortalConfig } from '@/modules/grievances/module.store.js';
import { portalConfigSchema } from '@/modules/grievances/module.validation.js';
import type { PortalConfigInput } from '@/modules/grievances/module.types.js';

export default function AdminPortalConfigPage() {
  const { data: config, isLoading } = usePortalConfig();
  const upsert = useUpsertPortalConfig();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PortalConfigInput>({
    resolver: zodResolver(portalConfigSchema),
    values: config ? { theme: config.theme, languages: config.languages, customText: config.customText } : undefined,
  });

  const onSubmit = async (data: PortalConfigInput) => {
    await upsert.mutateAsync(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-semibold">Worker Portal Configuration</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Languages (comma-separated codes)" error={errors.languages?.message}>
            <Input {...register('languages')} placeholder="en, es, fr" />
          </Field>

          <Field label="Custom Text (JSON)">
            <textarea
              className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              rows={6}
              {...register('customText')}
              placeholder='{"submitLabel": "Submit Report", "trackLabel": "Check Status"}'
            />
          </Field>

          <Field label="Theme (JSON)">
            <textarea
              className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              rows={6}
              {...register('theme')}
              placeholder='{"primaryColor": "#2563eb", "backgroundColor": "#ffffff"}'
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Configuration'}
            </Button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
