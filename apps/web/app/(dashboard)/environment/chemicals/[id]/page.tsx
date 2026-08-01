'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, FlaskConical } from 'lucide-react';
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
import { HAZARD_CLASSIFICATIONS, RISK_RATINGS, APPROVAL_STATUSES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  chemicalName: z.string().min(1),
  casNumber: z.string().optional(),
  formula: z.string().optional(),
  hazardClassification: z.string().min(1),
  storageLocation: z.string().optional(),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  expiryDate: z.string().optional(),
  usageDescription: z.string().optional(),
  riskRating: z.string().optional(),
  emergencyProcedures: z.string().optional(),
  ppeRequirements: z.string().optional(),
  approvalStatus: z.string().min(1),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function ChemicalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: chemical, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'chemicals', id],
    queryFn: () => environmentService.getChemical(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (chemical) {
      reset({
        chemicalName: chemical.chemicalName,
        casNumber: chemical.casNumber ?? '',
        formula: chemical.formula ?? '',
        hazardClassification: chemical.hazardClassification,
        storageLocation: chemical.storageLocation ?? '',
        quantity: chemical.quantity,
        unit: chemical.unit,
        expiryDate: chemical.expiryDate?.slice(0, 10) ?? '',
        usageDescription: chemical.usageDescription ?? '',
        riskRating: chemical.riskRating ?? '',
        emergencyProcedures: chemical.emergencyProcedures ?? '',
        ppeRequirements: chemical.ppeRequirements ?? '',
        approvalStatus: chemical.approvalStatus,
        notes: chemical.notes ?? '',
      });
    }
  }, [chemical, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateChemical(id, data),
    onSuccess: () => {
      toast({ title: 'Chemical updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'chemicals'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteChemical(id),
    onSuccess: () => {
      toast({ title: 'Chemical deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'chemicals'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/chemicals');
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

  if (isError || !chemical) {
    return (
      <ErrorState
        title="Chemical not found"
        message="The chemical you're looking for doesn't exist or you don't have access."
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
            <Link href="/dashboard/environment/chemicals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <FlaskConical className="h-5 w-5 text-pink-500" />
              {chemical.chemicalName}
            </h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              {chemical.casNumber ? `CAS ${chemical.casNumber}` : 'No CAS number'} · {chemical.quantity} {chemical.unit}
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
            <h2 className="text-base font-semibold">Edit Chemical</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Chemical Name" error={errors.chemicalName?.message}>
                <Input {...register('chemicalName')} />
              </Field>
              <Field label="CAS Number">
                <Input {...register('casNumber')} />
              </Field>
              <Field label="Formula">
                <Input {...register('formula')} />
              </Field>
              <Field label="Hazard Classification" error={errors.hazardClassification?.message}>
                <select {...register('hazardClassification')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {HAZARD_CLASSIFICATIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Quantity" error={errors.quantity?.message}>
                <Input type="number" step="0.01" {...register('quantity')} />
              </Field>
              <Field label="Unit">
                <Input {...register('unit')} />
              </Field>
              <Field label="Storage Location">
                <Input {...register('storageLocation')} />
              </Field>
              <Field label="Expiry Date">
                <Input type="date" {...register('expiryDate')} />
              </Field>
              <Field label="Risk Rating">
                <select {...register('riskRating')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  <option value="">—</option>
                  {RISK_RATINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Approval Status" error={errors.approvalStatus?.message}>
                <select {...register('approvalStatus')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {APPROVAL_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Usage Description" className="md:col-span-2">
                <Input {...register('usageDescription')} />
              </Field>
              <Field label="Emergency Procedures" className="md:col-span-2">
                <Input {...register('emergencyProcedures')} />
              </Field>
              <Field label="PPE Requirements" className="md:col-span-2">
                <Input {...register('ppeRequirements')} />
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">CAS Number</p><p className="mt-1 text-sm">{chemical.casNumber ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Formula</p><p className="mt-1 text-sm">{chemical.formula ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Hazard</p><p className="mt-1 text-sm capitalize">{chemical.hazardClassification.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Quantity</p><p className="mt-1 text-sm">{chemical.quantity} {chemical.unit}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Storage</p><p className="mt-1 text-sm">{chemical.storageLocation ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Expiry</p><p className="mt-1 text-sm">{chemical.expiryDate ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Risk Rating</p>
                <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  chemical.riskRating === 'high' || chemical.riskRating === 'extreme' ? 'bg-red-100 text-red-800' :
                  chemical.riskRating === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }`}>{chemical.riskRating ?? '—'}</span>
              </div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Approval</p><p className="mt-1 text-sm capitalize">{chemical.approvalStatus}</p></div>
              {chemical.usageDescription && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Usage</p><p className="mt-1 text-sm">{chemical.usageDescription}</p></div>
              )}
              {chemical.emergencyProcedures && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Emergency Procedures</p><p className="mt-1 text-sm">{chemical.emergencyProcedures}</p></div>
              )}
              {chemical.ppeRequirements && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">PPE Requirements</p><p className="mt-1 text-sm">{chemical.ppeRequirements}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Chemical" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{chemical.chemicalName}"? This action cannot be undone.</p>
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

