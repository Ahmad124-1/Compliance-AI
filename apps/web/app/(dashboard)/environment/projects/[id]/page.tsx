'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, TreePine } from 'lucide-react';
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
import { ENVIRONMENTAL_PROJECT_TYPES, PROJECT_STATUSES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().optional(),
  projectType: z.string().min(1),
  status: z.string().min(1),
  budget: z.coerce.number().nullable().optional(),
  actualCost: z.coerce.number().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  areaCovered: z.coerce.number().nullable().optional(),
  treesPlanted: z.coerce.number().nullable().optional(),
  progressNotes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'projects', id],
    queryFn: () => environmentService.getProject(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (project) {
      reset({
        projectName: project.projectName,
        description: project.description ?? '',
        projectType: project.projectType,
        status: project.status,
        budget: project.budget ?? null,
        actualCost: project.actualCost ?? null,
        startDate: project.startDate?.slice(0, 10) ?? '',
        endDate: project.endDate?.slice(0, 10) ?? '',
        location: project.location ?? '',
        areaCovered: project.areaCovered ?? null,
        treesPlanted: project.treesPlanted ?? null,
        progressNotes: project.progressNotes ?? '',
      });
    }
  }, [project, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateProject(id, { ...data, budget: data.budget ?? null, actualCost: data.actualCost ?? null, areaCovered: data.areaCovered ?? null, treesPlanted: data.treesPlanted ?? null }),
    onSuccess: () => {
      toast({ title: 'Project updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteProject(id),
    onSuccess: () => {
      toast({ title: 'Project deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/projects');
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

  if (isError || !project) {
    return (
      <ErrorState
        title="Project not found"
        message="The project you're looking for doesn't exist or you don't have access."
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
            <Link href="/dashboard/environment/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <TreePine className="h-5 w-5 text-green-600" />
                {project.projectName}
              </h1>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize">{project.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{project.projectType?.replace(/_/g, ' ')}</p>
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
            <h2 className="text-base font-semibold">Edit Project</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Project Name" error={errors.projectName?.message} className="md:col-span-2">
                <Input {...register('projectName')} />
              </Field>
              <Field label="Project Type" error={errors.projectType?.message}>
                <select {...register('projectType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {ENVIRONMENTAL_PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {PROJECT_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Budget">
                <Input type="number" step="0.01" {...register('budget')} />
              </Field>
              <Field label="Actual Cost">
                <Input type="number" step="0.01" {...register('actualCost')} />
              </Field>
              <Field label="Start Date">
                <Input type="date" {...register('startDate')} />
              </Field>
              <Field label="End Date">
                <Input type="date" {...register('endDate')} />
              </Field>
              <Field label="Location">
                <Input {...register('location')} />
              </Field>
              <Field label="Area Covered">
                <Input type="number" step="0.01" {...register('areaCovered')} />
              </Field>
              <Field label="Trees Planted">
                <Input type="number" step="1" {...register('treesPlanted')} />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea {...register('description')} rows={3} />
              </Field>
              <Field label="Progress Notes" className="md:col-span-2">
                <Textarea {...register('progressNotes')} rows={2} />
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Description</p><p className="mt-1 text-sm">{project.description ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Location</p><p className="mt-1 text-sm">{project.location ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Budget</p><p className="mt-1 text-sm">{project.budget ? `$${Number(project.budget).toLocaleString()}` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Actual Cost</p><p className="mt-1 text-sm">{project.actualCost ? `$${Number(project.actualCost).toLocaleString()}` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Start Date</p><p className="mt-1 text-sm">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">End Date</p><p className="mt-1 text-sm">{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Area Covered</p><p className="mt-1 text-sm">{project.areaCovered ? `${project.areaCovered} m\u00B2` : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Trees Planted</p><p className="mt-1 text-sm">{project.treesPlanted ?? '—'}</p></div>
              {project.progressNotes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Progress</p><p className="mt-1 text-sm">{project.progressNotes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Project" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{project.projectName}"? This action cannot be undone.</p>
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

