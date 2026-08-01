'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, FileCheck } from 'lucide-react';
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
import { PERMIT_TYPES, PERMIT_STATUSES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  permitType: z.string().min(1),
  permitNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  issueDate: z.string().min(1),
  expiryDate: z.string().min(1),
  renewalDate: z.string().optional(),
  status: z.string().min(1),
  conditions: z.string().optional(),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function PermitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: permit, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'permits', id],
    queryFn: () => environmentService.getPermit(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (permit) {
      reset({
        permitType: permit.permitType,
        permitNumber: permit.permitNumber,
        issuingAuthority: permit.issuingAuthority,
        issueDate: permit.issueDate?.slice(0, 10),
        expiryDate: permit.expiryDate?.slice(0, 10),
        renewalDate: permit.renewalDate?.slice(0, 10) ?? '',
        status: permit.status,
        conditions: permit.conditions ?? '',
        notes: permit.notes ?? '',
      });
    }
  }, [permit, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updatePermit(id, data),
    onSuccess: () => {
      toast({ title: 'Permit updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'permits'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deletePermit(id),
    onSuccess: () => {
      toast({ title: 'Permit deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'permits'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/permits');
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

  if (isError || !permit) {
    return (
      <ErrorState
        title="Permit not found"
        message="The permit you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const onSubmit = (data: EditData) => updateMutation.mutate(data);
  const expired = new Date(permit.expiryDate) < new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/environment/permits">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <FileCheck className="h-5 w-5 text-blue-600" />
                {permit.permitNumber}
              </h1>
              <span className={`rounded px-2 py-0.5 text-xs ${
                permit.status === 'active' ? 'bg-green-100 text-green-800' :
                permit.status === 'expired' ? 'bg-red-100 text-red-800' :
                permit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
              }`}>{permit.status}</span>
              {expired && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">Expired</span>}
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">
              {permit.permitType?.replace('_', ' ')} · {permit.issuingAuthority}
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
            <h2 className="text-base font-semibold">Edit Permit</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Permit Type" error={errors.permitType?.message}>
                <select {...register('permitType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {PERMIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Permit Number" error={errors.permitNumber?.message}>
                <Input {...register('permitNumber')} />
              </Field>
              <Field label="Issuing Authority" error={errors.issuingAuthority?.message}>
                <Input {...register('issuingAuthority')} />
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {PERMIT_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Issue Date" error={errors.issueDate?.message}>
                <Input type="date" {...register('issueDate')} />
              </Field>
              <Field label="Expiry Date" error={errors.expiryDate?.message}>
                <Input type="date" {...register('expiryDate')} />
              </Field>
              <Field label="Renewal Date">
                <Input type="date" {...register('renewalDate')} />
              </Field>
              <Field label="Conditions" className="md:col-span-2">
                <Textarea {...register('conditions')} rows={3} />
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Permit Number</p><p className="mt-1 text-sm">{permit.permitNumber}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Authority</p><p className="mt-1 text-sm">{permit.issuingAuthority}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Issue Date</p><p className="mt-1 text-sm">{new Date(permit.issueDate).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Expiry Date</p><p className="mt-1 text-sm">{new Date(permit.expiryDate).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Renewal Date</p><p className="mt-1 text-sm">{permit.renewalDate ? new Date(permit.renewalDate).toLocaleDateString() : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Documents</p><p className="mt-1 text-sm">{permit.supportingDocuments?.length ?? 0} attached</p></div>
              {permit.conditions && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Conditions</p><p className="mt-1 text-sm">{permit.conditions}</p></div>
              )}
              {permit.notes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Notes</p><p className="mt-1 text-sm">{permit.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Permit" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete permit "{permit.permitNumber}"? This action cannot be undone.</p>
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

