'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Save, X, Loader2, Trash, ShieldAlert } from 'lucide-react';
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
import { LIKELIHOOD_LEVELS, SEVERITY_LEVELS, RISK_STATUSES, REVIEW_SCHEDULES } from '@/modules/environment/constants.js';

const editSchema = z.object({
  aspect: z.string().min(1),
  impact: z.string().min(1),
  likelihood: z.string().min(1),
  severity: z.string().min(1),
  riskScore: z.coerce.number().nonnegative(),
  controls: z.string().optional(),
  mitigationMeasures: z.string().optional(),
  monitoringPlan: z.string().optional(),
  reviewSchedule: z.string().optional(),
  lastReviewDate: z.string().optional(),
  nextReviewDate: z.string().optional(),
  status: z.string().min(1),
  notes: z.string().optional(),
});

type EditData = z.infer<typeof editSchema>;

export default function RiskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: risk, isLoading, isError, refetch } = useQuery({
    queryKey: ['environment', 'risks', id],
    queryFn: () => environmentService.getRisk(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditData>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (risk) {
      reset({
        aspect: risk.aspect,
        impact: risk.impact,
        likelihood: risk.likelihood,
        severity: risk.severity,
        riskScore: risk.riskScore,
        controls: risk.controls ?? '',
        mitigationMeasures: risk.mitigationMeasures ?? '',
        monitoringPlan: risk.monitoringPlan ?? '',
        reviewSchedule: risk.reviewSchedule ?? '',
        lastReviewDate: risk.lastReviewDate?.slice(0, 10) ?? '',
        nextReviewDate: risk.nextReviewDate?.slice(0, 10) ?? '',
        status: risk.status,
        notes: risk.notes ?? '',
      });
    }
  }, [risk, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditData) => environmentService.updateRisk(id, data),
    onSuccess: () => {
      toast({ title: 'Risk updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'risks'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => environmentService.deleteRisk(id),
    onSuccess: () => {
      toast({ title: 'Risk deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['environment', 'risks'] });
      queryClient.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/risks');
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

  if (isError || !risk) {
    return (
      <ErrorState
        title="Risk not found"
        message="The risk you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const onSubmit = (data: EditData) => updateMutation.mutate(data);

  const scoreColor = (score: number) => {
    if (score >= 15) return 'rgb(239 68 68)';
    if (score >= 8) return 'rgb(245 158 11)';
    return 'rgb(34 197 94)';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/environment/risks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                {risk.aspect}
              </h1>
              <span className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-800 capitalize">{risk.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{risk.impact}</p>
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
            <h2 className="text-base font-semibold">Edit Risk</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Aspect" error={errors.aspect?.message}>
                <Input {...register('aspect')} />
              </Field>
              <Field label="Impact" error={errors.impact?.message}>
                <Input {...register('impact')} />
              </Field>
              <Field label="Likelihood" error={errors.likelihood?.message}>
                <select {...register('likelihood')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {LIKELIHOOD_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Severity" error={errors.severity?.message}>
                <select {...register('severity')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {SEVERITY_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Risk Score" error={errors.riskScore?.message}>
                <Input type="number" step="0.01" {...register('riskScore')} />
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  {RISK_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Controls">
                <Textarea {...register('controls')} rows={2} />
              </Field>
              <Field label="Mitigation Measures">
                <Textarea {...register('mitigationMeasures')} rows={2} />
              </Field>
              <Field label="Monitoring Plan" className="md:col-span-2">
                <Textarea {...register('monitoringPlan')} rows={2} />
              </Field>
              <Field label="Review Schedule">
                <select {...register('reviewSchedule')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                  <option value="">—</option>
                  {REVIEW_SCHEDULES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Last Review">
                  <Input type="date" {...register('lastReviewDate')} />
                </Field>
                <Field label="Next Review">
                  <Input type="date" {...register('nextReviewDate')} />
                </Field>
              </div>
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
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Details</h2>
              <span className="text-3xl font-bold" style={{ color: scoreColor(risk.riskScore) }}>{risk.riskScore}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Likelihood</p><p className="mt-1 text-sm capitalize">{risk.likelihood.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Severity</p><p className="mt-1 text-sm capitalize">{risk.severity}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Review Schedule</p><p className="mt-1 text-sm capitalize">{risk.reviewSchedule?.replace('_', ' ') ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Next Review</p><p className="mt-1 text-sm">{risk.nextReviewDate ? new Date(risk.nextReviewDate).toLocaleDateString() : '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Controls</p><p className="mt-1 text-sm">{risk.controls ?? '—'}</p></div>
              <div><p className="text-xs text-[rgb(var(--muted))] uppercase">Mitigation</p><p className="mt-1 text-sm">{risk.mitigationMeasures ?? '—'}</p></div>
              {risk.monitoringPlan && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Monitoring Plan</p><p className="mt-1 text-sm">{risk.monitoringPlan}</p></div>
              )}
              {risk.notes && (
                <div className="md:col-span-2"><p className="text-xs text-[rgb(var(--muted))] uppercase">Notes</p><p className="mt-1 text-sm">{risk.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Risk" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete this risk? This action cannot be undone.</p>
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

