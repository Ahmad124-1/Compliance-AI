'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Droplets, Trash } from 'lucide-react';
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
import { WATER_SOURCE_TYPES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  sourceType: z.string().min(1),
  consumptionDate: z.string().min(1),
  consumptionAmount: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  dischargeAmount: z.coerce.number().nullable().optional(),
  treatmentMethod: z.string().optional(),
  reuseAmount: z.coerce.number().default(0),
  leakDetected: z.boolean().default(false),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function WaterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: water, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'water', id],
    queryFn: () => environmentService.getWater(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (water) {
      reset({
        sourceType: water.sourceType,
        consumptionDate: water.consumptionDate?.slice(0, 10),
        consumptionAmount: water.consumptionAmount,
        unit: water.unit,
        dischargeAmount: water.dischargeAmount ?? null,
        treatmentMethod: water.treatmentMethod ?? '',
        reuseAmount: water.reuseAmount ?? 0,
        leakDetected: water.leakDetected,
        notes: water.notes ?? '',
      });
    }
  }, [water, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateWater(id, { ...data, dischargeAmount: data.dischargeAmount ?? null }),
    onSuccess: () => {
      toast({ title: 'Water record updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'water'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteWater(id),
    onSuccess: () => {
      toast({ title: 'Water record deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'water'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/water');
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

  if (isError || !water) {
    return (
      <ErrorState
        title="Water record not found"
        message="The record you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const onDelete = () => deleteMutation.mutate();
  const onSubmit = (data: EditData) => updateMutation.mutate(data);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/environment/water">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Droplets className="h-5 w-5 text-blue-500" />
              Water Usage Record
            </h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              {water.sourceType?.replace('_', ' ')} · {water.consumptionDate}
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
            <h2 className="text-base font-semibold">Edit Water Record</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Source Type" error={errors.sourceType?.message}>
                <select {...register('sourceType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {WATER_SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              <Field label="Discharge Amount">
                <Input type="number" step="0.01" {...register('dischargeAmount')} />
              </Field>
              <Field label="Treatment Method">
                <Input {...register('treatmentMethod')} />
              </Field>
              <Field label="Reuse Amount">
                <Input type="number" step="0.01" {...register('reuseAmount')} />
              </Field>
              <label className="flex items-center gap-2 text-sm pt-8">
                <input type="checkbox" {...register('leakDetected')} /> Leak Detected
              </label>
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Source</p><p className="mt-1 text-sm capitalize">{water.sourceType.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Consumption</p><p className="mt-1 text-sm">{water.consumptionAmount} {water.unit}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Discharge</p><p className="mt-1 text-sm">{water.dischargeAmount ? `${water.dischargeAmount} ${water.unit}` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Treatment</p><p className="mt-1 text-sm">{water.treatmentMethod ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Reuse</p><p className="mt-1 text-sm">{water.reuseAmount} {water.unit}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Leak</p><p className="mt-1 text-sm">{water.leakDetected ? 'Yes' : 'No'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Water Intensity</p><p className="mt-1 text-sm">{water.waterIntensity ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Verified</p><p className="mt-1 text-sm">{water.isVerified ? 'Yes' : 'No'}</p></div>
              <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Notes</p><p className="mt-1 text-sm">{water.notes ?? '—'}</p></div>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Water Record" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete this water usage record? This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

