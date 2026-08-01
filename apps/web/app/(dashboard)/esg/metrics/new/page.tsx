'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PILLARS, METRIC_DATA_TYPES, METRIC_FREQUENCIES } from '@/modules/esg/constants.js';

const metricSchema = z.object({
  frameworkId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  metricCode: z.string().min(1, 'Code is required'),
  category: z.string().min(1, 'Category is required'),
  pillar: z.string().min(1, 'Pillar is required'),
  unit: z.string().optional(),
  dataType: z.string().min(1, 'Data type is required'),
  reportingFrequency: z.string().min(1, 'Frequency is required'),
});

type MetricFormData = z.infer<typeof metricSchema>;

export default function EsgMetricNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: frameworks } = useQuery({
    queryKey: ['esg', 'frameworks', { all: true }],
    queryFn: () => esgService.listFrameworks({ limit: '100' }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MetricFormData>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      frameworkId: '',
      name: '',
      description: '',
      metricCode: '',
      category: '',
      pillar: 'environmental',
      unit: '',
      dataType: 'numeric',
      reportingFrequency: 'annual',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MetricFormData) =>
      esgService.createMetric({
        ...data,
        frameworkId: data.frameworkId || null,
        unit: data.unit || null,
        description: data.description || null,
        applicableFacilities: [],
        applicableDepartments: [],
        evidenceRequired: false,
        verificationRequired: false,
        isMandatory: false,
        isActive: true,
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Metric created', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'metrics'] });
      router.push(`/dashboard/esg/metrics/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create metric', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: MetricFormData) => createMutation.mutate(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/metrics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New ESG Metric</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define a new reporting metric.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Metric Details</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Metric Name" error={errors.name?.message}>
              <Input {...register('name')} placeholder="e.g., GHG Scope 1 Emissions" />
            </Field>
            <Field label="Metric Code" error={errors.metricCode?.message}>
              <Input {...register('metricCode')} placeholder="e.g., GHG-S1-T" />
            </Field>
          </div>

          <Field label="Category" error={errors.category?.message}>
            <Input {...register('category')} placeholder="e.g., Emissions" />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Pillar" error={errors.pillar?.message}>
              <select {...register('pillar')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                {PILLARS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Data Type" error={errors.dataType?.message}>
              <select {...register('dataType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                {METRIC_DATA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Reporting Frequency" error={errors.reportingFrequency?.message}>
              <select {...register('reportingFrequency')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                {METRIC_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Unit">
              <Input {...register('unit')} placeholder="e.g., tCO2e, kWh, m3" />
            </Field>
          </div>

          <Field label="Framework">
            <select {...register('frameworkId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
              <option value="">No framework</option>
              {(frameworks?.frameworks ?? []).map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <Textarea {...register('description')} rows={3} placeholder="Describe how this metric is calculated and reported..." />
          </Field>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/esg/metrics">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Create Metric
          </Button>
        </div>
      </form>
    </div>
  );
}

