'use client';

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
import { PILLARS } from '@/modules/esg/constants.js';
import { useAutoFill } from '@/modules/auto-populate/hooks/useAutoFill';

const disclosureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  pillar: z.string().min(1, 'Pillar is required'),
  metricId: z.string().optional(),
  frameworkId: z.string().optional(),
  periodId: z.string().min(1, 'Period is required'),
  summary: z.string().optional(),
});

type DisclosureFormData = z.infer<typeof disclosureSchema>;

export default function EsgDisclosureNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: periods } = useQuery({
    queryKey: ['esg', 'periods', { all: true }],
    queryFn: () => esgService.listPeriods({ limit: '100' }),
  });
  const { data: metrics } = useQuery({
    queryKey: ['esg', 'metrics', { all: true }],
    queryFn: () => esgService.listMetrics({ limit: '100' }),
  });
  const { data: frameworks } = useQuery({
    queryKey: ['esg', 'frameworks', { all: true }],
    queryFn: () => esgService.listFrameworks({ limit: '100' }),
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<DisclosureFormData>({
    resolver: zodResolver(disclosureSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      pillar: 'environmental',
      metricId: '',
      frameworkId: '',
      periodId: '',
      summary: '',
    },
  });
  const { useSetDefaults } = useAutoFill({});
  useSetDefaults(setValue, [{ name: 'programId', fillKey: 'programId' }, { name: 'goalId', fillKey: 'goalId' }, { name: 'kpiId', fillKey: 'kpiId' }, { name: 'reportingPeriodId', fillKey: 'reportingPeriodId' }, { name: 'facilityId', fillKey: 'facilityId' }, { name: 'projectId', fillKey: 'projectId' }, { name: 'supplierIds', fillKey: 'supplierIds' }]);

  const createMutation = useMutation({
    mutationFn: (data: DisclosureFormData) =>
      esgService.createDisclosure({
        ...data,
        metricId: data.metricId || null,
        frameworkId: data.frameworkId || null,
        description: data.description || null,
        summary: data.summary || null,
        status: 'draft',
        content: {},
        linkedDocuments: [],
        dataPoints: [],
        assuranceStatus: 'not_started',
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Disclosure created', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] });
      router.push(`/dashboard/esg/disclosures/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create disclosure', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: DisclosureFormData) => createMutation.mutate(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/disclosures">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Disclosure</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create a new ESG disclosure.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Disclosure Details</h2>

          <Field label="Disclosure Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., GHG Emissions Disclosure" />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <Input {...register('category')} placeholder="e.g., Emissions" />
            </Field>
            <Field label="Pillar" error={errors.pillar?.message}>
              <select {...register('pillar')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                {PILLARS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Reporting Period" error={errors.periodId?.message}>
            <select {...register('periodId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
              <option value="">Select a period...</option>
              {(periods?.periods ?? []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Linked Metric">
              <select {...register('metricId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                <option value="">No metric</option>
                {(metrics?.metrics ?? []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Framework">
              <select {...register('frameworkId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                <option value="">No framework</option>
                {(frameworks?.frameworks ?? []).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <Textarea {...register('description')} rows={3} placeholder="Describe this disclosure..." />
          </Field>

          <Field label="Summary">
            <Textarea {...register('summary')} rows={3} placeholder="Executive summary for this disclosure..." />
          </Field>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/esg/disclosures">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Create Disclosure
          </Button>
        </div>
      </form>
    </div>
  );
}

