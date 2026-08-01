'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, Send, Check, Eye, Calendar, User, FileText, ShieldCheck } from 'lucide-react';

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
import { PILLARS, DISCLOSURE_STATUSES } from '@/modules/esg/constants.js';

const disclosureEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  pillar: z.string().min(1, 'Pillar is required'),
  summary: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
});

type DisclosureEditData = z.infer<typeof disclosureEditSchema>;

export default function EsgDisclosureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: disclosure, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'disclosure', id],
    queryFn: () => esgService.getDisclosure(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisclosureEditData>({ resolver: zodResolver(disclosureEditSchema) });

  useEffect(() => {
    if (disclosure) {
      reset({
        name: disclosure.name,
        description: disclosure.description || '',
        category: disclosure.category,
        pillar: disclosure.pillar,
        summary: disclosure.summary || '',
        status: disclosure.status,
      });
    }
  }, [disclosure, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: DisclosureEditData) => esgService.updateDisclosure(id, data),
    onSuccess: () => {
      toast({ title: 'Disclosure updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosure', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteDisclosure(id),
    onSuccess: () => {
      toast({ title: 'Disclosure deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] });
      router.push('/dashboard/esg/disclosures');
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => esgService.updateDisclosure(id, { status: 'in_review', submittedBy: 'current-user', submittedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast({ title: 'Submitted for review', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosure', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => esgService.updateDisclosure(id, { status: 'approved', approvedBy: 'current-user', approvedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast({ title: 'Disclosure approved', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosure', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => esgService.updateDisclosure(id, { status: 'published', publishedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast({ title: 'Disclosure published', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosure', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] });
    },
  });

  const onSubmit = (data: DisclosureEditData) => updateMutation.mutate(data);

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      approved: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      archived: 'bg-gray-100 text-gray-800',
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

  if (isError || !disclosure) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Disclosure not found or you don't have access.</p>
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
            <Link href="/dashboard/esg/disclosures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{disclosure.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor(disclosure.status)}`}>{disclosure.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{disclosure.pillar} disclosure</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-1 h-3 w-3" />Edit
              </Button>
              {disclosure.status === 'draft' && (
                <Button variant="outline" size="sm" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                  <Send className="mr-1 h-3 w-3" />Submit
                </Button>
              )}
              {disclosure.status === 'in_review' && (
                <Button variant="outline" size="sm" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                  <Check className="mr-1 h-3 w-3" />Approve
                </Button>
              )}
              {disclosure.status === 'approved' && (
                <Button variant="outline" size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                  <Eye className="mr-1 h-3 w-3" />Publish
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
                <h2 className="text-base font-semibold">Edit Disclosure</h2>
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
                  <Field label="Category" error={errors.category?.message}>
                    <Input {...register('category')} />
                  </Field>
                  <Field label="Pillar">
                    <select {...register('pillar')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {PILLARS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Status">
                  <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    {DISCLOSURE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Description">
                  <Textarea {...register('description')} rows={3} />
                </Field>
                <Field label="Summary">
                  <Textarea {...register('summary')} rows={3} />
                </Field>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Disclosure Details</h2>
              <div className="space-y-3 text-sm">
                <p>{disclosure.description || 'No description provided.'}</p>
                {disclosure.summary && (
                  <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                    <p className="text-xs font-medium text-[rgb(var(--muted))] uppercase">Summary</p>
                    <p className="mt-1">{disclosure.summary}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Linked Data Points ({disclosure.dataPoints?.length ?? 0})</h2>
            {!disclosure.dataPoints?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No data points linked to this disclosure.</p>
            ) : (
              <div className="space-y-2">
                {disclosure.dataPoints.map((dp: string) => (
                  <div key={dp} className="rounded-lg border border-[rgb(var(--border-color))] p-3 text-sm">
                    <p className="font-medium">Data Point: {dp}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Status</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-[rgb(var(--muted))]">Status</span>
                <span className="capitalize">{disclosure.status}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[rgb(var(--muted))]">Assurance</span>
                <span className="capitalize">{disclosure.assuranceStatus}</span>
              </p>
              {disclosure.submittedAt && (
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />Submitted: {new Date(disclosure.submittedAt).toLocaleDateString()}</p>
              )}
              {disclosure.approvedAt && (
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-[rgb(var(--muted))]" />Approved: {new Date(disclosure.approvedAt).toLocaleDateString()}</p>
              )}
              {disclosure.publishedAt && (
                <p className="flex items-center gap-2"><Eye className="h-4 w-4 text-[rgb(var(--muted))]" />Published: {new Date(disclosure.publishedAt).toLocaleDateString()}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Disclosure" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete "{disclosure.name}"? This action cannot be undone.
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
