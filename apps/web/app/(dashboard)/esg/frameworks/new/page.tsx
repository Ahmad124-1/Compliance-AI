'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { FRAMEWORK_CODES } from '@/modules/esg/constants.js';

const frameworkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frameworkCode: z.string().min(1, 'Framework is required'),
  version: z.string().min(1, 'Version is required'),
  issuingBody: z.string().optional(),
  effectiveDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FrameworkFormData = z.infer<typeof frameworkSchema>;

export default function EsgFrameworkNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FrameworkFormData>({
    resolver: zodResolver(frameworkSchema),
    defaultValues: {
      name: '',
      description: '',
      frameworkCode: 'gri',
      version: '2023',
      issuingBody: '',
      effectiveDate: '',
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FrameworkFormData) =>
      esgService.createFramework({ ...data, frameworkCode: data.frameworkCode as 'gri' }),
    onSuccess: (result: any) => {
      toast({ title: 'Framework created', description: 'Your framework has been created successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'frameworks'] });
      router.push(`/dashboard/esg/frameworks/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create framework', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: FrameworkFormData) => createMutation.mutate(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/frameworks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New ESG Framework</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Configure a reporting standard framework.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Framework Details</h2>

          <Field label="Framework Code" error={errors.frameworkCode?.message}>
            <select
              {...register('frameworkCode')}
              className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
            >
              {FRAMEWORK_CODES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Framework Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., GRI Sustainability Reporting Standards" />
          </Field>

          <Field label="Version" error={errors.version?.message}>
            <Input {...register('version')} placeholder="e.g., 2023" />
          </Field>

          <Field label="Issuing Body">
            <Input {...register('issuingBody')} placeholder="e.g., Global Reporting Initiative" />
          </Field>

          <Field label="Effective Date">
            <Input type="date" {...register('effectiveDate')} />
          </Field>

          <Field label="Description">
            <Textarea {...register('description')} rows={4} placeholder="Describe the framework's scope and requirements..." />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
            <span>Active (enabled for reporting)</span>
          </label>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/esg/frameworks">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Create Framework
          </Button>
        </div>
      </form>
    </div>
  );
}

