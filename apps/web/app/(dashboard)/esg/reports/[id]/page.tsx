'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, Download, Calendar, User, FileText, FileDown } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { REPORT_STATUSES } from '@/modules/esg/constants.js';

const reportEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'generating', 'completed', 'approved', 'published', 'archived', 'failed']),
  summary: z.string().optional(),
});

type ReportEditData = z.infer<typeof reportEditSchema>;

export default function EsgReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'report', id],
    queryFn: () => esgService.getReport(id),
  });

  const periodId = report?.periodId;

  const { data: period } = useQuery({
    queryKey: ['esg', 'period', periodId],
    queryFn: () => esgService.getPeriod(periodId as string),
    enabled: !!periodId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportEditData>({ resolver: zodResolver(reportEditSchema) });

  useEffect(() => {
    if (report) {
      reset({
        name: report.name,
        description: report.description || '',
        status: report.status,
        summary: report.summary || '',
      });
    }
  }, [report, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ReportEditData) =>
      esgService.updateReport(id, {
        name: data.name,
        description: data.description || undefined,
        status: data.status,
        summary: data.summary || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Report updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'report', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'reports'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteReport(id),
    onSuccess: () => {
      toast({ title: 'Report deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'reports'] });
      router.push('/dashboard/esg/reports');
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const onSubmit = (data: ReportEditData) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Report not found or you don't have access.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/esg/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{report.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor(report.status)}`}>{report.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">
              {report.reportType.replace(/_/g, ' ')} · {report.format.toUpperCase()} · {period?.name ?? report.periodId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              {report.fileUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={report.fileUrl} download><Download className="mr-1 h-3 w-3" />Download</a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-1 h-3 w-3" />Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-1 h-3 w-3" />Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold">Edit Report</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); reset(); }}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </div>
              <form className="space-y-4">
                <Field label="Name" error={errors.name?.message}>
                  <Input {...register('name')} />
                </Field>
                <Field label="Status" error={errors.status?.message}>
                  <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    {REPORT_STATUSES.map((rs) => (
                      <option key={rs.value} value={rs.value}>{rs.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Description">
                  <Textarea rows={3} {...register('description')} />
                </Field>
                <Field label="Summary">
                  <Textarea rows={3} {...register('summary')} />
                </Field>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Report Details</h2>
              <div className="space-y-3 text-sm">
                {report.description && <p>{report.description}</p>}
                {report.summary && <p className="text-[rgb(var(--muted))]">{report.summary}</p>}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                    <p className="text-xs text-[rgb(var(--muted))]">Format</p>
                    <p className="font-semibold">{report.format.toUpperCase()}</p>
                  </div>
                  {report.pagesCount != null && (
                    <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                      <p className="text-xs text-[rgb(var(--muted))]">Pages</p>
                      <p className="font-semibold">{report.pagesCount}</p>
                    </div>
                  )}
                  {report.fileSizeBytes != null && (
                    <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                      <p className="text-xs text-[rgb(var(--muted))]">Size</p>
                      <p className="font-semibold">{(report.fileSizeBytes / 1024).toFixed(1)} KB</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Generation</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <FileDown className="h-4 w-4 text-[rgb(var(--muted))]" />
                {report.generatedAt ? `Generated: ${new Date(report.generatedAt).toLocaleString()}` : 'Not generated yet'}
              </p>
              {report.generatedBy && (
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[rgb(var(--muted))]" />
                  By: {report.generatedBy}
                </p>
              )}
              {report.fileUrl && (
                <p className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                  File: {report.fileUrl}
                </p>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Approval</h2>
            <div className="space-y-2 text-sm">
              {report.approvedAt ? (
                <>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                    Approved: {new Date(report.approvedAt).toLocaleDateString()}
                  </p>
                  {report.approvedBy && (
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[rgb(var(--muted))]" />
                      By: {report.approvedBy}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[rgb(var(--muted))]">Not approved yet.</p>
              )}
              {report.publishedAt && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  Published: {new Date(report.publishedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Created: {new Date(report.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Updated: {new Date(report.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Report" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete this report? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

