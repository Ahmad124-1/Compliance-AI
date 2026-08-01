'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, BookOpen, Calendar, Building2, FileText } from 'lucide-react';

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
import { FRAMEWORK_CODES } from '@/modules/esg/constants.js';

const frameworkEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frameworkCode: z.string().min(1, 'Framework is required'),
  version: z.string().min(1, 'Version is required'),
  issuingBody: z.string().optional(),
  effectiveDate: z.string().optional(),
  isActive: z.boolean(),
});

type FrameworkEditData = z.infer<typeof frameworkEditSchema>;

export default function EsgFrameworkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: framework, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'framework', id],
    queryFn: () => esgService.getFramework(id),
  });

  const { data: metrics } = useQuery({
    queryKey: ['esg', 'framework', 'metrics', id],
    queryFn: () => esgService.listFrameworkMetrics(id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FrameworkEditData>({ resolver: zodResolver(frameworkEditSchema) });

  useEffect(() => {
    if (framework) {
      reset({
        name: framework.name,
        description: framework.description || '',
        frameworkCode: framework.frameworkCode,
        version: framework.version,
        issuingBody: framework.issuingBody || '',
        effectiveDate: framework.effectiveDate || '',
        isActive: framework.isActive,
      });
    }
  }, [framework, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FrameworkEditData) => esgService.updateFramework(id, data),
    onSuccess: () => {
      toast({ title: 'Framework updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'framework', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'frameworks'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteFramework(id),
    onSuccess: () => {
      toast({ title: 'Framework deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'frameworks'] });
      router.push('/dashboard/esg/frameworks');
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: FrameworkEditData) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !framework) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Framework not found or you don't have access.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/esg/frameworks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{framework.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${framework.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {framework.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{framework.frameworkCode.toUpperCase()} · v{framework.version}</p>
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
                <h2 className="text-base font-semibold">Edit Framework</h2>
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
                <Field label="Framework Code" error={errors.frameworkCode?.message}>
                  <select {...register('frameworkCode')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    {FRAMEWORK_CODES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Name" error={errors.name?.message}>
                  <Input {...register('name')} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Version" error={errors.version?.message}>
                    <Input {...register('version')} />
                  </Field>
                  <Field label="Issuing Body">
                    <Input {...register('issuingBody')} />
                  </Field>
                </div>
                <Field label="Effective Date">
                  <Input type="date" {...register('effectiveDate')} />
                </Field>
                <Field label="Description">
                  <Textarea {...register('description')} rows={3} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                  <span>Active</span>
                </label>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Framework Details</h2>
              <div className="space-y-3 text-sm">
                <p>{framework.description || 'No description provided.'}</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>{framework.frameworkCode.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>{framework.issuingBody ?? 'No issuing body'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>{framework.effectiveDate ? new Date(framework.effectiveDate).toLocaleDateString() : 'No effective date'}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Metrics linked to framework */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Framework Metrics ({metrics?.length ?? 0})</h2>
            {!metrics?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No metrics linked to this framework yet.</p>
            ) : (
              <div className="space-y-2">
                {(metrics as any[]).map((m: any) => (
                  <Link key={m.id} href={`/dashboard/esg/metrics/${m.id}`}
                    className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3 hover:bg-[rgb(var(--panel-2))] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{m.metricCode} · {m.pillar}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[rgb(var(--muted))]">{m.dataType}</span>
                  </Link>
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
                Created: {new Date(framework.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Updated: {new Date(framework.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Framework" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete "{framework.name}"? This action cannot be undone.
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

