'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash } from 'lucide-react';
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
import { WASTE_TYPES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  wasteType: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  weight: z.coerce.number().nullable().optional(),
  disposalMethod: z.string().min(1),
  manifestNumber: z.string().optional(),
  hazardousDetails: z.string().optional(),
  wasteDate: z.string().min(1),
  cost: z.coerce.number().nullable().optional(),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function WasteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: record, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'waste', id],
    queryFn: () => environmentService.getWaste(id),
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
        wasteType: record.wasteType,
        quantity: record.quantity,
        unit: record.unit,
        weight: record.weight ?? null,
        disposalMethod: record.disposalMethod,
        manifestNumber: record.manifestNumber ?? '',
        hazardousDetails: record.hazardousDetails ?? '',
        wasteDate: record.wasteDate?.slice(0, 10),
        cost: record.cost ?? null,
        notes: record.notes ?? '',
      });
    }
  }, [record, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateWaste(id, { ...data, weight: data.weight ?? null, cost: data.cost ?? null }),
    onSuccess: () => {
      toast({ title: 'Waste record updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'waste'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteWaste(id),
    onSuccess: () => {
      toast({ title: 'Waste record deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'waste'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/waste');
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
        title="Waste record not found"
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
            <Link href="/dashboard/environment/waste">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Waste Record</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              {record.wasteType?.replace('_', ' ')} · {record.wasteDate}
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
            <h2 className="text-base font-semibold">Edit Waste Record</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Waste Type" error={errors.wasteType?.message}>
                <select {...register('wasteType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {WASTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Waste Date" error={errors.wasteDate?.message}>
                <Input type="date" {...register('wasteDate')} />
              </Field>
              <Field label="Quantity" error={errors.quantity?.message}>
                <Input type="number" step="0.01" {...register('quantity')} />
              </Field>
              <Field label="Unit">
                <Input {...register('unit')} />
              </Field>
              <Field label="Weight">
                <Input type="number" step="0.01" {...register('weight')} />
              </Field>
              <Field label="Disposal Method" error={errors.disposalMethod?.message}>
                <Input {...register('disposalMethod')} />
              </Field>
              <Field label="Manifest Number">
                <Input {...register('manifestNumber')} />
              </Field>
              <Field label="Cost">
                <Input type="number" step="0.01" {...register('cost')} />
              </Field>
              <Field label="Hazardous Details" className="md:col-span-2">
                <Input {...register('hazardousDetails')} />
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Waste Type</p><p className="mt-1 text-sm capitalize">{record.wasteType.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Date</p><p className="mt-1 text-sm">{record.wasteDate}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Quantity</p><p className="mt-1 text-sm">{record.quantity} {record.unit}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Weight</p><p className="mt-1 text-sm">{record.weight ? `${record.weight} ${record.unit}` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Disposal Method</p><p className="mt-1 text-sm">{record.disposalMethod}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Manifest</p><p className="mt-1 text-sm">{record.manifestNumber ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Cost</p><p className="mt-1 text-sm">{record.cost ? `$${Number(record.cost).toLocaleString()}` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Verified</p><p className="mt-1 text-sm">{record.isVerified ? 'Yes' : 'No'}</p></div>
              {record.hazardousDetails && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Hazardous Details</p><p className="mt-1 text-sm">{record.hazardousDetails}</p></div>
              )}
              {record.notes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Notes</p><p className="mt-1 text-sm">{record.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Waste Record" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete this waste record? This action cannot be undone.</p>
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

