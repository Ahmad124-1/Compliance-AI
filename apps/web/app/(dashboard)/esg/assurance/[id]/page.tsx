'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, CheckCircle2, XCircle, Calendar, Building2, ShieldCheck, FileText } from 'lucide-react';

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
import { ASSURANCE_TYPES, ASSURANCE_OPINIONS } from '@/modules/esg/constants.js';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const assuranceEditSchema = z.object({
  assuranceType: z.string().min(1, 'Type is required'),
  scopeDescription: z.string().min(1, 'Scope is required'),
  providerName: z.string().optional(),
  providerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  assuranceDate: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  conclusion: z.string().optional(),
  opinionType: z.string().optional(),
});

type AssuranceEditData = z.infer<typeof assuranceEditSchema>;

export default function EsgAssuranceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: assurance, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'assurance', id],
    queryFn: () => esgService.getAssurance(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssuranceEditData>({ resolver: zodResolver(assuranceEditSchema) });

  useEffect(() => {
    if (assurance) {
      reset({
        assuranceType: assurance.assuranceType,
        scopeDescription: assurance.scopeDescription,
        providerName: assurance.providerName || '',
        providerEmail: assurance.providerEmail || '',
        assuranceDate: assurance.assuranceDate || '',
        status: assurance.status,
        conclusion: assurance.conclusion || '',
        opinionType: assurance.opinionType || '',
      });
    }
  }, [assurance, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: AssuranceEditData) => esgService.updateAssurance(id, {
      status: data.status,
      findings: assurance?.findings ?? [],
      conclusion: data.conclusion || undefined,
      opinionType: data.opinionType || undefined,
      evidenceReferences: assurance?.evidenceReferences ?? [],
    }),
    onSuccess: () => {
      toast({ title: 'Assurance updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteAssurance(id),
    onSuccess: () => {
      toast({ title: 'Assurance deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance'] });
      router.push('/dashboard/esg/assurance');
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => esgService.updateAssurance(id, { status: 'completed' }),
    onSuccess: () => {
      toast({ title: 'Assurance marked as completed', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance'] });
    },
  });

  const failedMutation = useMutation({
    mutationFn: () => esgService.updateAssurance(id, { status: 'failed' }),
    onSuccess: () => {
      toast({ title: 'Assurance marked as failed', variant: 'error' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance'] });
    },
  });

  const onSubmit = (data: AssuranceEditData) => updateMutation.mutate(data);

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      planned: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
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

  if (isError || !assurance) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Assurance engagement not found or you don't have access.</p>
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
            <Link href="/dashboard/esg/assurance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{assurance.assuranceType.replace(/_/g, ' ')} Engagement</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor(assurance.status)}`}>{assurance.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{assurance.providerName ?? 'No provider'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-1 h-3 w-3" />Edit
              </Button>
              {assurance.status === 'in_progress' && (
                <Button variant="outline" size="sm" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />Complete
                </Button>
              )}
              {assurance.status === 'in_progress' && (
                <Button variant="outline" size="sm" className="text-red-500" onClick={() => failedMutation.mutate()} disabled={failedMutation.isPending}>
                  <XCircle className="mr-1 h-3 w-3" />Fail
                </Button>
              )}
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
                <h2 className="text-base font-semibold">Edit Engagement</h2>
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
                <Field label="Type">
                  <select {...register('assuranceType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    {ASSURANCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Scope" error={errors.scopeDescription?.message}>
                  <Textarea {...register('scopeDescription')} rows={2} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Provider Name" error={errors.providerName?.message}>
                    <Input {...register('providerName')} />
                  </Field>
                  <Field label="Provider Email" error={errors.providerEmail?.message}>
                    <Input type="email" {...register('providerEmail')} />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Assurance Date">
                    <Input type="date" {...register('assuranceDate')} />
                  </Field>
                  <Field label="Status">
                    <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Opinion Type">
                  <select {...register('opinionType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    <option value="">Not specified</option>
                    {ASSURANCE_OPINIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Conclusion">
                  <Textarea {...register('conclusion')} rows={3} />
                </Field>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Engagement Details</h2>
              <div className="space-y-3 text-sm">
                <p>{assurance.scopeDescription}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>{assurance.providerName ?? 'No provider'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span className="capitalize">{assurance.assuranceType.replace(/_/g, ' ')}</span>
                  </div>
                  {assurance.assuranceDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>{new Date(assurance.assuranceDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span className="capitalize">{assurance.opinionType || 'No opinion recorded'}</span>
                  </div>
                </div>
                {assurance.conclusion && (
                  <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                    <p className="text-xs font-medium text-[rgb(var(--muted))] uppercase">Conclusion</p>
                    <p className="mt-1">{assurance.conclusion}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Findings ({assurance.findings?.length ?? 0})</h2>
            {!assurance.findings?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No findings recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {assurance.findings.map((f: any, i: number) => (
                  <div key={i} className="rounded-lg border border-[rgb(var(--border-color))] p-3 text-sm">
                    <p className="font-medium">{f.title ?? `Finding ${i + 1}`}</p>
                    {f.description && <p className="text-xs text-[rgb(var(--muted))]}">{f.description}</p>}
                    {f.severity && <span className="mt-1 inline-block rounded bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">{f.severity}</span>}
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
                Created: {new Date(assurance.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Updated: {new Date(assurance.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Assurance" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete this engagement? This action cannot be undone.
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

