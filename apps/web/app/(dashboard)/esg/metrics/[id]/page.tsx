'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, FileText, ShieldCheck, BarChart3, GitBranch } from 'lucide-react';

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
import { PILLARS, METRIC_DATA_TYPES, METRIC_FREQUENCIES } from '@/modules/esg/constants.js';

const metricEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  metricCode: z.string().min(1, 'Code is required'),
  category: z.string().min(1, 'Category is required'),
  pillar: z.string().min(1, 'Pillar is required'),
  unit: z.string().optional(),
  dataType: z.string().min(1, 'Data type is required'),
  reportingFrequency: z.string().min(1, 'Frequency is required'),
  isActive: z.boolean(),
});

type MetricEditData = z.infer<typeof metricEditSchema>;

export default function EsgMetricDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: metric, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'metric', id],
    queryFn: () => esgService.getMetric(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetricEditData>({ resolver: zodResolver(metricEditSchema) });

  useEffect(() => {
    if (metric) {
      reset({
        name: metric.name,
        description: metric.description || '',
        metricCode: metric.metricCode,
        category: metric.category,
        pillar: metric.pillar,
        unit: metric.unit || '',
        dataType: metric.dataType,
        reportingFrequency: metric.reportingFrequency,
        isActive: metric.isActive,
      });
    }
  }, [metric, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: MetricEditData) => esgService.updateMetric(id, data),
    onSuccess: () => {
      toast({ title: 'Metric updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'metric', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'metrics'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteMetric(id),
    onSuccess: () => {
      toast({ title: 'Metric deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'metrics'] });
      router.push('/dashboard/esg/metrics');
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: MetricEditData) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !metric) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Metric not found or you don't have access.</p>
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
            <Link href="/dashboard/esg/metrics">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{metric.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${metric.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {metric.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{metric.metricCode}</p>
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
                <h2 className="text-base font-semibold">Edit Metric</h2>
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
                  <Field label="Name" error={errors.name?.message}>
                    <Input {...register('name')} />
                  </Field>
                  <Field label="Code" error={errors.metricCode?.message}>
                    <Input {...register('metricCode')} />
                  </Field>
                </div>
                <Field label="Category" error={errors.category?.message}>
                  <Input {...register('category')} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Pillar">
                    <select {...register('pillar')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {PILLARS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Data Type">
                    <select {...register('dataType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {METRIC_DATA_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Reporting Frequency">
                    <select {...register('reportingFrequency')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {METRIC_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Unit">
                    <Input {...register('unit')} />
                  </Field>
                </div>
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
              <h2 className="mb-4 text-base font-semibold">Metric Details</h2>
              <div className="space-y-3 text-sm">
                <p>{metric.description || 'No description provided.'}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span className="capitalize">{metric.pillar} Pillar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>{metric.dataType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>{metric.reportingFrequency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>{metric.unit || 'No unit'}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Configuration</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-[rgb(var(--muted))]">Mandatory</span><span>{metric.isMandatory ? 'Yes' : 'No'}</span></p>
              <p className="flex justify-between"><span className="text-[rgb(var(--muted))]">Evidence Required</span><span>{metric.evidenceRequired ? 'Yes' : 'No'}</span></p>
              <p className="flex justify-between"><span className="text-[rgb(var(--muted))]">Verification Required</span><span>{metric.verificationRequired ? 'Yes' : 'No'}</span></p>
              <p className="flex justify-between"><span className="text-[rgb(var(--muted))]">Baseline</span><span>{metric.baselineValue ?? '-'}</span></p>
              <p className="flex justify-between"><span className="text-[rgb(var(--muted))]">Target</span><span>{metric.targetValue ?? '-'}</span></p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Metric" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete "{metric.name}"? This action cannot be undone.
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

