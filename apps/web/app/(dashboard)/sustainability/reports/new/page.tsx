'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, FileText, Send, FileSpreadsheet, File as FilePdf } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { masterDataLookup } from '@/modules/data-hub/service.js';
import { REPORT_TYPES_SUSTAINABILITY } from '@/modules/sustainability/constants.js';
import { useAutoFill } from '@/modules/auto-populate/hooks/useAutoFill.js';

const reportSchema = z.object({
  programId: z.string().optional(),
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  reportType: z.enum(['progress', 'goal_status', 'sdg_contribution', 'kpi_performance', 'initiative_status', 'executive_summary'], {
    required_error: 'Report type is required',
  }),
  format: z.enum(['pdf', 'xlsx', 'docx']).optional(),
  params: z.record(z.unknown()).default({}),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeTables: z.boolean().default(true),
  includeKpis: z.boolean().default(true),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  const { data: programs } = useQuery({
    queryKey: ['data-hub', 'sync', 'lookup', 'program'],
    queryFn: () => masterDataLookup.programs(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: '',
      description: '',
      reportType: undefined,
      format: 'pdf',
      includeCharts: true,
      includeTables: true,
      includeKpis: true,
    },
  });

  const { useSetDefaults: useSetReportDefaults } = useAutoFill<ReportFormData>();
  useSetReportDefaults(setValue, [{ name: 'programId', fillKey: 'programId' }]);

  const createMutation = useMutation({
    mutationFn: (data: ReportFormData) =>
      sustainabilityService.createReport({
        ...data,
        programId: data.programId || null,
        format: selectedFormat,
        params: {
          ...data.params,
          dateRangeStart: data.dateRangeStart || undefined,
          dateRangeEnd: data.dateRangeEnd || undefined,
          includeCharts: data.includeCharts,
          includeTables: data.includeTables,
          includeKpis: data.includeKpis,
        },
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Report generated', description: 'Your report has been generated successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'reports'] });
      router.push(`/sustainability/reports/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to generate report', description: err.message, variant: 'error' });
    },
  });

  const saveDraft = async () => {
    const values = watch();
    try {
      await sustainabilityService.createReport({ ...values, format: selectedFormat, status: 'draft' });
      toast({ title: 'Draft saved', description: 'Your report draft has been saved.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'reports'] });
    } catch (err: any) {
      toast({ title: 'Failed to save draft', description: err.message, variant: 'error' });
    }
  };

  const onSubmit = (data: ReportFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sustainability/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Generate Report</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create a sustainability report in your preferred format.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Report Details</h2>

          <Field label="Report Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Q1 2025 Sustainability Progress Report" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register('description')} placeholder="Describe the report's purpose and scope..." rows={3} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Report Type" error={errors.reportType?.message}>
              <select
                {...register('reportType')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">Select report type...</option>
                {REPORT_TYPES_SUSTAINABILITY.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Linked Program">
              <select
                {...register('programId')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">All Programs</option>
                {programs?.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Format & Date Range</h2>

          <Field label="Export Format">
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'pdf', label: 'PDF', icon: FilePdf },
                { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
                { value: 'docx', label: 'Word', icon: FileText },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.value)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    selectedFormat === fmt.value
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]'
                      : 'border-[rgb(var(--border-color))] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]'
                  }`}
                >
                  <fmt.icon className="h-4 w-4" />
                  {fmt.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Date Range Start">
              <Input type="date" {...register('dateRangeStart')} />
            </Field>
            <Field label="Date Range End">
              <Input type="date" {...register('dateRangeEnd')} />
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Content Options</h2>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('includeCharts')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
              Include Charts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('includeTables')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
              Include Tables
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('includeKpis')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
              Include KPIs
            </label>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={saveDraft} disabled={isSubmitting}>
            <FileText className="mr-2 h-4 w-4" />Save as Draft
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sustainability/reports">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

