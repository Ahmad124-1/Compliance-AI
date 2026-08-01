'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, CheckCircle2, Calendar, Building2, User, FileText } from 'lucide-react';

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

const dataPointEditSchema = z.object({
  value: z.coerce.number({ invalid_type_error: 'Value must be a number' }),
  valueText: z.string().optional(),
  unit: z.string().optional(),
  confidenceScore: z.coerce.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional(),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
});

type DataPointEditData = z.infer<typeof dataPointEditSchema>;

export default function DataPointDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: dp, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'data-point', id],
    queryFn: () => esgService.getDataPoint(id),
  });

  const metricId = dp?.metricId;
  const periodId = dp?.periodId;

  const { data: metric } = useQuery({
    queryKey: ['esg', 'metric', metricId],
    queryFn: () => esgService.getMetric(metricId as string),
    enabled: !!metricId,
  });

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
  } = useForm<DataPointEditData>({ resolver: zodResolver(dataPointEditSchema) });

  useEffect(() => {
    if (dp) {
      reset({
        value: dp.value,
        valueText: dp.valueText || '',
        unit: dp.unit || '',
        confidenceScore: dp.confidenceScore,
        notes: dp.notes || '',
        sourceSystem: dp.sourceSystem || '',
        sourceReference: dp.sourceReference || '',
      });
    }
  }, [dp, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: DataPointEditData) => esgService.updateDataPoint(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast({ title: 'Data point updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'data-point', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'data-points'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => esgService.verifyDataPoint(id),
    onSuccess: () => {
      toast({ title: 'Data point verified', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'data-point', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'data-points'] });
    },
    onError: (err: Error) => toast({ title: 'Verify failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteDataPoint(id),
    onSuccess: () => {
      toast({ title: 'Data point deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'data-points'] });
      router.push('/dashboard/esg/data-points');
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const onSubmit = (data: DataPointEditData) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !dp) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Data point not found or you don't have access.</p>
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
            <Link href="/dashboard/esg/data-points">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{metric?.name ?? 'Data Point'}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${dp.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {dp.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{period?.name ?? dp.periodId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              {!dp.isVerified && (
                <Button variant="outline" size="sm" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />Verify
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
                <h2 className="text-base font-semibold">Edit Data Point</h2>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Value" error={errors.value?.message}>
                    <Input type="number" step="any" {...register('value')} />
                  </Field>
                  <Field label="Unit">
                    <Input {...register('unit')} />
                  </Field>
                </div>
                <Field label="Text Value">
                  <Input {...register('valueText')} />
                </Field>
                <Field label="Confidence Score" error={errors.confidenceScore?.message}>
                  <Input type="number" min={0} max={100} {...register('confidenceScore')} />
                </Field>
                <Field label="Source System">
                  <Input {...register('sourceSystem')} />
                </Field>
                <Field label="Source Reference">
                  <Input {...register('sourceReference')} />
                </Field>
                <Field label="Notes">
                  <Textarea rows={3} {...register('notes')} />
                </Field>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Data Point Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span className="font-medium">{metric?.name ?? dp.metricId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>{period?.name ?? dp.periodId}</span>
                </div>
                <p className="text-2xl font-bold">{dp.value} {dp.unit ?? ''}</p>
                {dp.valueText && <p>{dp.valueText}</p>}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>Confidence: {dp.confidenceScore ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>Source: {dp.sourceSystem ?? 'N/A'}{dp.sourceReference ? ` (${dp.sourceReference})` : ''}</span>
                </div>
                {dp.notes && <p className="text-[rgb(var(--muted))]">{dp.notes}</p>}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Verification</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(var(--muted))]" />
                Status: {dp.isVerified ? 'Verified' : 'Pending'}
              </p>
              {dp.verifiedBy && (
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[rgb(var(--muted))]" />
                  By: {dp.verifiedBy}
                </p>
              )}
              {dp.verifiedAt && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  At: {new Date(dp.verifiedAt).toLocaleString()}
                </p>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Created: {new Date(dp.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Updated: {new Date(dp.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Data Point" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete this data point? This action cannot be undone.
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

