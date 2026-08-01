'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PERIOD_TYPES, PERIOD_STATUSES } from '@/modules/esg/constants.js';

const periodEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  periodType: z.string().min(1, 'Type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.string().min(1, 'Status is required'),
});

type PeriodEditData = z.infer<typeof periodEditSchema>;

export default function EsgPeriodDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: period, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'period', id],
    queryFn: () => esgService.getPeriod(id),
  });

  const { data: assessments } = useQuery({
    queryKey: ['esg', 'period', 'assessments', id],
    queryFn: () => esgService.listPeriodAssessments(id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeriodEditData>({ resolver: zodResolver(periodEditSchema) });

  useEffect(() => {
    if (period) {
      reset({
        name: period.name,
        periodType: period.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        dueDate: period.dueDate,
        status: period.status,
      });
    }
  }, [period, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: PeriodEditData) => esgService.updatePeriod(id, data),
    onSuccess: () => {
      toast({ title: 'Period updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'period', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'periods'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deletePeriod(id),
    onSuccess: () => {
      toast({ title: 'Period deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'periods'] });
      router.push('/dashboard/esg/periods');
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: PeriodEditData) => updateMutation.mutate(data);

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      extended: 'bg-blue-100 text-blue-800',
      finalized: 'bg-indigo-100 text-indigo-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !period) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Reporting period not found or you don't have access.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/esg/periods">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{period.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor(period.status)}`}>{period.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))] capitalize">{period.periodType} reporting period</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
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
                <h2 className="text-base font-semibold">Edit Period</h2>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Type">
                    <select {...register('periodType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {PERIOD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
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
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Period Details</h2>
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>Start: {new Date(period.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>End: {new Date(period.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>Due: {new Date(period.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {period.frameworks?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {period.frameworks.map((fw: string) => (
                      <span key={fw} className="inline-flex rounded-full bg-[rgb(var(--primary))]/10 px-2.5 py-1 text-xs text-[rgb(var(--primary))]">
                        {fw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Materiality Assessments ({assessments?.length ?? 0})</h2>
            {!assessments?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No materiality assessments recorded for this period.</p>
            ) : (
              <div className="space-y-2">
                {(assessments as any[]).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <p className="text-sm font-medium">{a.topicId}</p>
                    </div>
                    <span className="text-xs text-[rgb(var(--muted))]">Priority: {a.overallPriorityScore ?? '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Created: {new Date(period.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Updated: {new Date(period.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Period" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete "{period.name}"? This action cannot be undone.
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

