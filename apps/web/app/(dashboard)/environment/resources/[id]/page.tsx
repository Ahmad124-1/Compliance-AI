'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Field } from '@/components/ui/Field.js';
import { Dialog } from '@/components/ui/Dialog.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { ErrorState } from '@/components/ui/states.js';
import { useToast } from '@/providers/ToastProvider.js';
import { environmentService } from '@/modules/environment/service.js';
import { RESOURCE_TYPES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  resourceType: z.string().min(1),
  consumptionAmount: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  cost: z.coerce.number().nullable().optional(),
  consumptionDate: z.string().min(1),
  reportingPeriod: z.string().min(1),
  efficiencyRating: z.coerce.number().nullable().optional(),
  intensityMetric: z.coerce.number().nullable().optional(),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: record, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'resources', id],
    queryFn: () => environmentService.getResource(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (record) {
      reset({
        resourceType: record.resourceType,
        consumptionAmount: record.consumptionAmount,
        unit: record.unit,
        cost: record.cost ?? null,
        consumptionDate: record.consumptionDate?.slice(0, 10),
        reportingPeriod: record.reportingPeriod,
        efficiencyRating: record.efficiencyRating ?? null,
        intensityMetric: record.intensityMetric ?? null,
        notes: record.notes ?? '',
      });
    }
  }, [record, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateResource(id, { ...data, cost: data.cost ?? null, efficiencyRating: data.efficiencyRating ?? null, intensityMetric: data.intensityMetric ?? null }),
    onSuccess: () => {
      toast({ title: 'Resource record updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'resources'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteResource(id),
    onSuccess: () => {
      toast({ title: 'Resource record deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'resources'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/resources');
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <ErrorState
        title="Resource record not found"
        message="The record you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const onSubmit = (data: EditData) => updateMutation.mutate(data);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/environment/resources">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Zap className="h-5 w-5 text-yellow-600" />
              Resource Usage
            </h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              {record.resourceType?.replace('_', ' ')} · {record.consumptionDate}
            </p>
          </div>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="p-5">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-base font-semibold">Edit Resource Usage</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Resource Type" error={errors.resourceType?.message}>
                <select {...register('resourceType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Consumption Date" error={errors.consumptionDate?.message}>
                <Input type="date" {...register('consumptionDate')} />
              </Field>
              <Field label="Consumption Amount" error={errors.consumptionAmount?.message}>
                <Input type="number" step="0.01" {...register('consumptionAmount')} />
              </Field>
              <Field label="Unit">
                <Input {...register('unit')} />
              </Field>
              <Field label="Cost">
                <Input type="number" step="0.01" {...register('cost')} />
              </Field>
              <Field label="Reporting Period" error={errors.reportingPeriod?.message}>
                <Input {...register('reportingPeriod')} />
              </Field>
              <Field label="Efficiency Rating">
                <Input type="number" step="0.01" {...register('efficiencyRating')} />
              </Field>
              <Field label="Intensity Metric">
                <Input type="number" step="0.01" {...register('intensityMetric')} />
              </Field>
              <Field label="Notes" className="md:col-span-2">
                <Textarea {...register('notes')} rows={2} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsEditing(false); reset(); }}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Resource Type</p><p className="mt-1 text-sm capitalize">{record.resourceType.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Consumption</p><p className="mt-1 text-sm">{record.consumptionAmount} {record.unit}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Cost</p><p className="mt-1 text-sm">{record.cost ? `$${Number(record.cost).toLocaleString()}` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Reporting Period</p><p className="mt-1 text-sm">{record.reportingPeriod}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Efficiency</p><p className="mt-1 text-sm">{record.efficiencyRating != null ? `${record.efficiencyRating}%` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Intensity</p><p className="mt-1 text-sm">{record.intensityMetric ?? '—'}</p></div>
              {record.notes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Notes</p><p className="mt-1 text-sm">{record.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Resource Record" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete this resource usage record? This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

