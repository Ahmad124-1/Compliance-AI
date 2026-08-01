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
import { REPORT_TYPES, REPORT_FORMATS } from '@/modules/esg/constants.js';

const reportSchema = z.object({
  periodId: z.string().min(1, 'Reporting period is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  reportType: z.enum(['comprehensive', 'sustainability', 'climate', 'social', 'governance', 'regulatory_filing', 'executive_summary', 'stakeholder', 'custom']),
  format: z.enum(['pdf', 'xlsx', 'docx', 'json', 'html']),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function NewEsgReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>({ resolver: zodResolver(reportSchema), defaultValues: { reportType: 'sustainability', format: 'pdf' } });

  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['esg', 'periods', 'options'],
    queryFn: () => esgService.listPeriods({ limit: '200' }),
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => esgService.createReport(input),
    onSuccess: (result: any) => {
      toast({ title: 'Report created', variant: 'success' });
      router.push(`/dashboard/esg/reports/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Create failed', description: err.message, variant: 'error' });
      setSubmitting(false);
    },
  });

  const onSubmit = (data: ReportFormData) => {
    setSubmitting(true);
    createMutation.mutate({
      periodId: data.periodId,
      name: data.name,
      description: data.description || undefined,
      reportType: data.reportType,
      format: data.format,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Generate ESG Report</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create a new ESG report for a reporting period.</p>
        </div>
      </div>

      <Card className="p-6">
        {periodsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Reporting Period" error={errors.periodId?.message}>
              <select {...register('periodId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                <option value="">Select period...</option>
                {(periods?.periods ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Report Name" error={errors.name?.message}>
              <Input placeholder="e.g. FY2024 Sustainability Report" {...register('name')} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Report Type" error={errors.reportType?.message}>
                <select {...register('reportType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {REPORT_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Format" error={errors.format?.message}>
                <select {...register('format')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {REPORT_FORMATS.map((rf) => (
                    <option key={rf.value} value={rf.value}>{rf.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea rows={3} placeholder="What does this report cover?" {...register('description')} />
            </Field>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Report
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

