'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';

const dataPointSchema = z.object({
  metricId: z.string().min(1, 'Metric is required'),
  periodId: z.string().min(1, 'Reporting period is required'),
  facilityId: z.string().optional(),
  departmentId: z.string().optional(),
  value: z.coerce.number({ invalid_type_error: 'Value must be a number' }),
  unit: z.string().optional(),
  confidenceScore: z.coerce.number().min(0).max(100).optional().nullable(),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
  notes: z.string().optional(),
});

type DataPointFormData = z.infer<typeof dataPointSchema>;

export default function NewDataPointPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataPointFormData>({ resolver: zodResolver(dataPointSchema) });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['esg', 'metrics', 'options'],
    queryFn: () => esgService.listMetrics({ limit: '200' }),
  });

  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['esg', 'periods', 'options'],
    queryFn: () => esgService.listPeriods({ limit: '200' }),
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => esgService.createDataPoint(input),
    onSuccess: (result: any) => {
      toast({ title: 'Data point created', variant: 'success' });
      router.push(`/dashboard/esg/data-points/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Create failed', description: err.message, variant: 'error' });
      setSubmitting(false);
    },
  });

  const onSubmit = (data: DataPointFormData) => {
    setSubmitting(true);
    createMutation.mutate({
      metricId: data.metricId,
      periodId: data.periodId,
      facilityId: data.facilityId || undefined,
      departmentId: data.departmentId || undefined,
      value: data.value,
      unit: data.unit || undefined,
      confidenceScore: data.confidenceScore ?? undefined,
      sourceSystem: data.sourceSystem || undefined,
      sourceReference: data.sourceReference || undefined,
      notes: data.notes || undefined,
    });
  };

  const loading = metricsLoading || periodsLoading;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/data-points">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Data Point</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Record an ESG metric value for a reporting period.</p>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Metric" error={errors.metricId?.message}>
              <select {...register('metricId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                <option value="">Select metric...</option>
                {(metrics?.metrics ?? []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.metricCode})</option>
                ))}
              </select>
            </Field>
            <Field label="Reporting Period" error={errors.periodId?.message}>
              <select {...register('periodId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                <option value="">Select period...</option>
                {(periods?.periods ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Value" error={errors.value?.message}>
                <Input type="number" step="any" {...register('value')} />
              </Field>
              <Field label="Unit">
                <Input placeholder="e.g. tCO2e, %, kWh" {...register('unit')} />
              </Field>
            </div>
            <Field label="Confidence Score" error={errors.confidenceScore?.message}>
              <Input type="number" min={0} max={100} placeholder="0-100" {...register('confidenceScore')} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Source System">
                <Input placeholder="e.g. ERP, EMS, manual" {...register('sourceSystem')} />
              </Field>
              <Field label="Source Reference">
                <Input placeholder="e.g. invoice ref, meter id" {...register('sourceReference')} />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea rows={3} {...register('notes')} />
            </Field>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Data Point
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

