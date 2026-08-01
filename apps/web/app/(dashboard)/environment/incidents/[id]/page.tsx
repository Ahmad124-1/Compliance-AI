'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, AlertTriangle } from 'lucide-react';
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
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATUSES, INVESTIGATION_STATUSES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  incidentType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.string().min(1),
  status: z.string().min(1),
  incidentDate: z.string().min(1),
  location: z.string().optional(),
  rootCause: z.string().optional(),
  investigationStatus: z.string().optional(),
  investigationNotes: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: incident, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'incidents', id],
    queryFn: () => environmentService.getIncident(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (incident) {
      reset({
        incidentType: incident.incidentType,
        title: incident.title,
        description: incident.description ?? '',
        severity: incident.severity,
        status: incident.status,
        incidentDate: incident.incidentDate?.slice(0, 10),
        location: incident.location ?? '',
        rootCause: incident.rootCause ?? '',
        investigationStatus: incident.investigationStatus ?? '',
        investigationNotes: incident.investigationNotes ?? '',
        resolutionNotes: incident.resolutionNotes ?? '',
      });
    }
  }, [incident, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateIncident(id, data),
    onSuccess: () => {
      toast({ title: 'Incident updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'incidents'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteIncident(id),
    onSuccess: () => {
      toast({ title: 'Incident deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'incidents'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/incidents');
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

  if (isError || !incident) {
    return (
      <ErrorState
        title="Incident not found"
        message="The incident you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const onSubmit = (data: EditData) => updateMutation.mutate(data);

  const severityColor = (s: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      contained: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-purple-100 text-purple-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/environment/incidents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {incident.title}
              </h1>
              <span className={`rounded px-2 py-0.5 text-xs ${severityColor(incident.severity)}`}>{incident.severity}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${statusColor(incident.status)}`}>{incident.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">
              {incident.incidentType?.replace(/_/g, ' ')} · {incident.incidentDate}
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
            <h2 className="text-base font-semibold">Edit Incident</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" error={errors.title?.message} className="md:col-span-2">
                <Input {...register('title')} />
              </Field>
              <Field label="Incident Type" error={errors.incidentType?.message}>
                <select {...register('incidentType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Incident Date" error={errors.incidentDate?.message}>
                <Input type="date" {...register('incidentDate')} />
              </Field>
              <Field label="Severity" error={errors.severity?.message}>
                <select {...register('severity')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {INCIDENT_SEVERITIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {INCIDENT_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Location">
                <Input {...register('location')} />
              </Field>
              <Field label="Root Cause">
                <Input {...register('rootCause')} />
              </Field>
              <Field label="Investigation Status">
                <select {...register('investigationStatus')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  <option value="">—</option>
                  {INVESTIGATION_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea {...register('description')} rows={3} />
              </Field>
              <Field label="Investigation Notes" className="md:col-span-2">
                <Textarea {...register('investigationNotes')} rows={2} />
              </Field>
              <Field label="Resolution Notes" className="md:col-span-2">
                <Textarea {...register('resolutionNotes')} rows={2} />
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
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Description</p><p className="mt-1 text-sm">{incident.description ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Location</p><p className="mt-1 text-sm">{incident.location ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Root Cause</p><p className="mt-1 text-sm">{incident.rootCause ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Investigation</p><p className="mt-1 text-sm capitalize">{incident.investigationStatus?.replace('_', ' ') ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Reported</p><p className="mt-1 text-sm">{incident.reportedBy ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Resolved</p><p className="mt-1 text-sm">{incident.resolutionDate ? new Date(incident.resolutionDate).toLocaleDateString() : '—'}</p></div>
              {incident.investigationNotes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Investigation Notes</p><p className="mt-1 text-sm">{incident.investigationNotes}</p></div>
              )}
              {incident.resolutionNotes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Resolution Notes</p><p className="mt-1 text-sm">{incident.resolutionNotes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Incident" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{incident.title}"? This action cannot be undone.</p>
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

