'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit2, Save, X, Loader2, Trash2, CheckCircle2, Calendar, User, FileText, TrendingUp } from 'lucide-react';

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
import { PILLARS, FINANCIAL_IMPACTS } from '@/modules/esg/constants.js';

const topicEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  pillar: z.enum(['environmental', 'social', 'governance']),
  externalDrivers: z.string().optional(),
  internalDrivers: z.string().optional(),
  stakeholderGroups: z.string().optional(),
  impactScore: z.coerce.number().min(0).max(5).optional().nullable(),
  likelihoodScore: z.coerce.number().min(0).max(5).optional().nullable(),
  financialImpact: z.enum(['high', 'medium', 'low', 'negligible']).optional(),
});

type TopicEditData = z.infer<typeof topicEditSchema>;

export default function MaterialityTopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: topic, isLoading, isError, refetch } = useQuery({
    queryKey: ['esg', 'materiality-topic', id],
    queryFn: () => esgService.getMaterialityTopic(id),
  });

  const { data: assessments } = useQuery({
    queryKey: ['esg', 'materiality-assessments', id],
    queryFn: () => esgService.listMaterialityAssessments({ topicId: id, limit: '50' }),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicEditData>({ resolver: zodResolver(topicEditSchema) });

  useEffect(() => {
    if (topic) {
      reset({
        name: topic.name,
        description: topic.description || '',
        category: topic.category,
        pillar: topic.pillar,
        externalDrivers: (topic.externalDrivers ?? []).join(', '),
        internalDrivers: (topic.internalDrivers ?? []).join(', '),
        stakeholderGroups: (topic.stakeholderGroups ?? []).join(', '),
        impactScore: topic.impactScore,
        likelihoodScore: topic.likelihoodScore,
        financialImpact: topic.financialImpact ?? undefined,
      });
    }
  }, [topic, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: TopicEditData) =>
      esgService.updateMaterialityTopic(id, {
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        pillar: data.pillar,
        externalDrivers: data.externalDrivers ? data.externalDrivers.split(',').map((s) => s.trim()).filter(Boolean) : [],
        internalDrivers: data.internalDrivers ? data.internalDrivers.split(',').map((s) => s.trim()).filter(Boolean) : [],
        stakeholderGroups: data.stakeholderGroups ? data.stakeholderGroups.split(',').map((s) => s.trim()).filter(Boolean) : [],
        impactScore: data.impactScore ?? undefined,
        likelihoodScore: data.likelihoodScore ?? undefined,
        financialImpact: data.financialImpact ?? undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Topic updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'materiality-topic', id] });
      queryClient.invalidateQueries({ queryKey: ['esg', 'materiality'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => esgService.deleteMaterialityTopic(id),
    onSuccess: () => {
      toast({ title: 'Topic deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'materiality'] });
      router.push('/dashboard/esg/materiality');
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const onSubmit = (data: TopicEditData) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !topic) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Topic not found or you don't have access.</p>
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
            <Link href="/dashboard/esg/materiality">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{topic.name}</h1>
            <p className="text-sm text-[rgb(var(--muted))]">{topic.pillar} · {topic.category}</p>
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
                <h2 className="text-base font-semibold">Edit Topic</h2>
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
                  <Field label="Pillar" error={errors.pillar?.message}>
                    <select {...register('pillar')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {PILLARS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Category" error={errors.category?.message}>
                    <Input {...register('category')} />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Impact Score" error={errors.impactScore?.message}>
                    <Input type="number" min={0} max={5} step="0.1" {...register('impactScore')} />
                  </Field>
                  <Field label="Likelihood Score" error={errors.likelihoodScore?.message}>
                    <Input type="number" min={0} max={5} step="0.1" {...register('likelihoodScore')} />
                  </Field>
                </div>
                <Field label="Financial Impact">
                  <select {...register('financialImpact')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    <option value="">Select...</option>
                    {FINANCIAL_IMPACTS.map((fi) => (
                      <option key={fi.value} value={fi.value}>{fi.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="External Drivers">
                  <Input {...register('externalDrivers')} />
                </Field>
                <Field label="Internal Drivers">
                  <Input {...register('internalDrivers')} />
                </Field>
                <Field label="Stakeholder Groups">
                  <Input {...register('stakeholderGroups')} />
                </Field>
                <Field label="Description">
                  <Textarea rows={3} {...register('description')} />
                </Field>
              </form>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h2 className="mb-4 text-base font-semibold">Topic Details</h2>
                <div className="space-y-3 text-sm">
                  {topic.description && <p>{topic.description}</p>}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                      <p className="text-xs text-[rgb(var(--muted))]">Impact Score</p>
                      <p className="text-2xl font-bold">{topic.impactScore ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                      <p className="text-xs text-[rgb(var(--muted))]">Likelihood</p>
                      <p className="text-2xl font-bold">{topic.likelihoodScore ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3">
                      <p className="text-xs text-[rgb(var(--muted))]">Financial Impact</p>
                      <p className="text-2xl font-bold">{topic.financialImpact ?? '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">External Drivers</p>
                    <p className="text-[rgb(var(--muted))]">{(topic.externalDrivers ?? []).length ? topic.externalDrivers.join(', ') : 'None'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Internal Drivers</p>
                    <p className="text-[rgb(var(--muted))]">{(topic.internalDrivers ?? []).length ? topic.internalDrivers.join(', ') : 'None'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Stakeholder Groups</p>
                    <p className="text-[rgb(var(--muted))]">{(topic.stakeholderGroups ?? []).length ? topic.stakeholderGroups.join(', ') : 'None'}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
                  <TrendingUp className="h-4 w-4 text-[rgb(var(--primary))]" />
                  Assessments
                </h2>
                {!assessments ? (
                  <Skeleton className="h-32 w-full" />
                ) : (assessments?.assessments ?? []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-[rgb(var(--muted))]">No assessments yet for this topic.</p>
                ) : (
                  <div className="space-y-2">
                    {(assessments?.assessments ?? []).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">Impact {a.impactScore} · Likelihood {a.likelihoodScore}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">Period {a.periodId}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${a.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {a.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Metadata</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(var(--muted))]" />
                Status: {topic.isActive ? 'Active' : 'Inactive'}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Created: {new Date(topic.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                Updated: {new Date(topic.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Topic" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete this materiality topic? This action cannot be undone.
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

