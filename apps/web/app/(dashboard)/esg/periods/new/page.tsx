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
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PERIOD_TYPES, PERIOD_STATUSES, FRAMEWORK_CODES } from '@/modules/esg/constants.js';

const periodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  periodType: z.string().min(1, 'Type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.string().default('upcoming'),
});

type PeriodFormData = z.infer<typeof periodSchema>;

export default function EsgPeriodNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      name: '',
      periodType: 'annual',
      startDate: '',
      endDate: '',
      dueDate: '',
      status: 'upcoming',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PeriodFormData) =>
      esgService.createPeriod({
        ...data,
        frameworks: [],
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Period created', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'periods'] });
      router.push(`/dashboard/esg/periods/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create period', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: PeriodFormData) => createMutation.mutate(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/periods">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Reporting Period</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create an ESG reporting period.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Period Details</h2>

          <Field label="Period Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., FY 2024 Annual Reporting Period" />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Period Type" error={errors.periodType?.message}>
              <select {...register('periodType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                {PERIOD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                {PERIOD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Start Date" error={errors.startDate?.message}>
              <Input type="date" {...register('startDate')} />
            </Field>
            <Field label="End Date" error={errors.endDate?.message}>
              <Input type="date" {...register('endDate')} />
            </Field>
            <Field label="Due Date" error={errors.dueDate?.message}>
              <Input type="date" {...register('dueDate')} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/esg/periods">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Create Period
          </Button>
        </div>
      </form>
    </div>
  );
}

