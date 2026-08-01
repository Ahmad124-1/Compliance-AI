'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, Wind } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Field } from '@/components/ui/Field.js';
import { Dialog } from '@/components/ui/Dialog.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { ErrorState } from '@/components/ui/states.js';
import { useToast } from '@/providers/ToastProvider.js';
import { environmentService } from '@/modules/environment/service.js';
import { AIR_EMISSION_TYPES, MONITORING_FREQUENCIES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  emissionType: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  monitoringFrequency: z.string().optional(),
  emissionLimit: z.coerce.number().nullable().optional(),
  concentration: z.coerce.number().nullable().optional(),
  emissionDate: z.string().min(1),
  reportingPeriod: z.string().min(1),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function AirDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: record, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'air', id],
    queryFn: () => environmentService.getAir(id),
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
        emissionType: record.emissionType,
        quantity: record.quantity,
        unit: record.unit,
        monitoringFrequency: record.monitoringFrequency ?? '',
        emissionLimit: record.emissionLimit ?? null,
        concentration: record.concentration ?? null,
        emissionDate: record.emissionDate?.slice(0, 10),
        reportingPeriod: record.reportingPeriod,
        notes: record.notes ?? '',
      });
    }
  }, [record, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateAir(id, { ...data, emissionLimit: data.emissionLimit ?? null, concentration: data.concentration ?? null }),
    onSuccess: () => {
      toast({ title: 'Air emission updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'air'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteAir(id),
    onSuccess: () => {
      toast({ title: 'Air emission deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'air'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/air');
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
        title="Air emission record not found"
        message="The record you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const onSubmit = (data: EditData) => updateMutation.mutate(data);
  const limitCompliance = record.emissionLimit && record.quantity > record.emissionLimit ? 'Breached' : 'Within Limit';

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/environment/air">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Wind className="h-5 w-5 text-purple-500" />
              Air Emission Record
            </h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              {record.emissionType?.replace('_', ' ')} · {record.emissionDate}
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
            <h2 className="text-base font-semibold">Edit Air Emission</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Emission Type" error={errors.emissionType?.message}>
                <select {...register('emissionType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {AIR_EMISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Emission Date" error={errors.emissionDate?.message}>
                <Input type="date" {...register('emissionDate')} />
              </Field>
              <Field label="Quantity" error={errors.quantity?.message}>
                <Input type="number" step="0.01" {...register('quantity')} />
              </Field>
              <Field label="Unit">
                <Input {...register('unit')} />
              </Field>
              <Field label="Monitoring Frequency">
                <select {...register('monitoringFrequency')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {MONITORING_FREQUENCIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Reporting Period" error={errors.reportingPeriod?.message}>
                <Input {...register('reportingPeriod')} />
              </Field>
              <Field label="Emission Limit">
                <Input type="number" step="0.01" {...register('emissionLimit')} />
              </Field>
              <Field label="Concentration">
                <Input type="number" step="0.01" {...register('concentration')} />
              </Field>
              <Field label="Notes" className="md:col-span-2">
                <Input {...register('notes')} />
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Emission Type</p><p className="mt-1 text-sm capitalize">{record.emissionType.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Date</p><p className="mt-1 text-sm">{record.emissionDate}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Quantity</p><p className="mt-1 text-sm">{record.quantity} {record.unit}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Frequency</p><p className="mt-1 text-sm capitalize">{record.monitoringFrequency?.replace('_', ' ') ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Reporting Period</p><p className="mt-1 text-sm">{record.reportingPeriod}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Concentration</p><p className="mt-1 text-sm">{record.concentration ? `${record.concentration} ${record.unit}` : '—'}</p></div>
              {record.emissionLimit != null && (
                <div className="md:col-span-2">
                  <p className="text-xs text-[rgb(var(--muted))] uppercase">Limit Compliance</p>
                  <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${record.quantity > record.emissionLimit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {limitCompliance} ({record.emissionLimit} {record.unit})
                  </span>
                </div>
              )}
              {record.notes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Notes</p><p className="mt-1 text-sm">{record.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Air Emission" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete this air emission record? This action cannot be undone.</p>
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

