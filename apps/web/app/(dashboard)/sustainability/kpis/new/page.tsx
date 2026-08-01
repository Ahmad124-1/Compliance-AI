'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, FileText, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { KPI_TYPES, KPI_FREQUENCIES } from '@/modules/sustainability/constants.js';

const kpiSchema = z.object({
  programId: z.string().optional(),
  goalId: z.string().optional(),
  initiativeId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  kpiType: z.enum(['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean'], {
    required_error: 'KPI type is required',
  }),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  unit: z.string().min(1, 'Unit is required'),
  targetValue: z.coerce.number().nullable().optional(),
  baselineValue: z.coerce.number().nullable().optional(),
  thresholdWarning: z.coerce.number().nullable().optional(),
  thresholdCritical: z.coerce.number().nullable().optional(),
  aggregation: z.enum(['latest', 'sum', 'avg', 'min', 'max', 'count']).optional(),
  departmentId: z.string().optional(),
  facilityId: z.string().optional(),
  ownerId: z.string().optional(),
});

type KpiFormData = z.infer<typeof kpiSchema>;

export default function KpiNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programs } = useQuery({
    queryKey: ['sustainability', 'programs', { limit: 100 }],
    queryFn: () => sustainabilityService.listPrograms({ limit: 100 }),
  });

  const { data: goals } = useQuery({
    queryKey: ['sustainability', 'goals', { limit: 100 }],
    queryFn: () => sustainabilityService.listGoals({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<KpiFormData>({
    resolver: zodResolver(kpiSchema),
    defaultValues: {
      name: '',
      description: '',
      kpiType: undefined,
      frequency: 'monthly',
      unit: '',
      targetValue: null,
      baselineValue: null,
      thresholdWarning: null,
      thresholdCritical: null,
      aggregation: 'latest',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: KpiFormData) =>
      sustainabilityService.createKpi({
        ...data,
        programId: data.programId || null,
        goalId: data.goalId || null,
        initiativeId: data.initiativeId || null,
        departmentId: data.departmentId || null,
        facilityId: data.facilityId || null,
        ownerId: data.ownerId || null,
      }),
    onSuccess: (result: any) => {
      toast({ title: 'KPI created', description: 'Your KPI has been created successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'kpis'] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'dashboard'] });
      router.push(`/dashboard/sustainability/kpis/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create KPI', description: err.message, variant: 'error' });
    },
  });

  const saveDraft = async () => {
    const values = watch();
    try {
      await sustainabilityService.createKpi(values);
      toast({ title: 'Draft saved', description: 'Your KPI draft has been saved.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'kpis'] });
    } catch (err: any) {
      toast({ title: 'Failed to save draft', description: err.message, variant: 'error' });
    }
  };

  const onSubmit = (data: KpiFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sustainability/kpis">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New KPI</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define a key performance indicator for sustainability tracking.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Basic Information</h2>

          <Field label="KPI Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Carbon Intensity per Revenue" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register('description')} placeholder="Describe what this KPI measures and how it's calculated..." rows={3} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="KPI Type" error={errors.kpiType?.message}>
              <select
                {...register('kpiType')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">Select type...</option>
                {KPI_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Frequency" error={errors.frequency?.message}>
              <select
                {...register('frequency')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                {KPI_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Unit" error={errors.unit?.message}>
              <Input {...register('unit')} placeholder="e.g., tCO2e/revenue, %, kWh" />
            </Field>

            <Field label="Aggregation Method" error={errors.aggregation?.message}>
              <select
                {...register('aggregation')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="latest">Latest Value</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
                <option value="count">Count</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Targets & Thresholds</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Baseline Value" error={errors.baselineValue?.message}>
              <Input type="number" step="any" {...register('baselineValue')} placeholder="Starting value" />
            </Field>
            <Field label="Target Value" error={errors.targetValue?.message}>
              <Input type="number" step="any" {...register('targetValue')} placeholder="Desired target value" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Warning Threshold" error={errors.thresholdWarning?.message} hint="Value that triggers a warning">
              <Input type="number" step="any" {...register('thresholdWarning')} placeholder="e.g., 80" />
            </Field>
            <Field label="Critical Threshold" error={errors.thresholdCritical?.message} hint="Value that triggers critical alert">
              <Input type="number" step="any" {...register('thresholdCritical')} placeholder="e.g., 90" />
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Linked Entities</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Linked Program">
              <select
                {...register('programId')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">No program</option>
                {programs?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Linked Goal">
              <select
                {...register('goalId')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">No goal</option>
                {goals?.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={saveDraft} disabled={isSubmitting}>
            <FileText className="mr-2 h-4 w-4" />Save as Draft
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/sustainability/kpis">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Create KPI
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

