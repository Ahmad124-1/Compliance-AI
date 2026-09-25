'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, FileText, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { masterDataLookup } from '@/modules/data-hub/service.js';
import { ESG_PILLARS } from '@/modules/sustainability/constants.js';
import { useAutoFill } from '@/modules/auto-populate/hooks/useAutoFill';

const goalSchema = z.object({
  programId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  esgPillar: z.enum(['environment', 'social', 'governance'], { required_error: 'ESG pillar is required' }),
  baseline: z.coerce.number().nullable().optional(),
  targetValue: z.coerce.number().min(0, 'Target must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  currentValue: z.coerce.number().nullable().optional(),
  deadline: z.string().optional(),
  ownerId: z.string().optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  linkedSdgs: z.array(z.number()).default([]),
});

type GoalFormData = z.infer<typeof goalSchema>;

const SDG_OPTIONS = [
  { id: 1, name: 'No Poverty' }, { id: 2, name: 'Zero Hunger' },
  { id: 3, name: 'Good Health and Well-being' }, { id: 4, name: 'Quality Education' },
  { id: 5, name: 'Gender Equality' }, { id: 6, name: 'Clean Water and Sanitation' },
  { id: 7, name: 'Affordable and Clean Energy' }, { id: 8, name: 'Decent Work and Economic Growth' },
  { id: 9, name: 'Industry, Innovation and Infrastructure' }, { id: 10, name: 'Reduced Inequalities' },
  { id: 11, name: 'Sustainable Cities and Communities' }, { id: 12, name: 'Responsible Consumption and Production' },
  { id: 13, name: 'Climate Action' }, { id: 14, name: 'Life Below Water' },
  { id: 15, name: 'Life on Land' }, { id: 16, name: 'Peace, Justice and Strong Institutions' },
  { id: 17, name: 'Partnerships for the Goals' },
];

export default function GoalNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);

  const { data: programs } = useQuery({
    queryKey: ['data-hub', 'sync', 'lookup', 'program'],
    queryFn: () => masterDataLookup.programs(),
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      description: '',
      esgPillar: undefined,
      baseline: null,
      targetValue: 0,
      unit: '%',
      currentValue: null,
      deadline: '',
      confidence: 'medium',
      riskLevel: 'medium',
      linkedSdgs: [],
    },
  });
  const { useSetDefaults } = useAutoFill({});
  useSetDefaults(setValue, [{ name: 'programId', fillKey: 'programId' }, { name: 'goalId', fillKey: 'goalId' }, { name: 'kpiId', fillKey: 'kpiId' }, { name: 'reportingPeriodId', fillKey: 'reportingPeriodId' }, { name: 'facilityId', fillKey: 'facilityId' }, { name: 'projectId', fillKey: 'projectId' }, { name: 'supplierIds', fillKey: 'supplierIds' }]);

  const createMutation = useMutation({
    mutationFn: (data: GoalFormData) =>
      sustainabilityService.createGoal({
        ...data,
        programId: data.programId || null,
        linkedSdgs: selectedSdgs,
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Goal created', description: 'Your ESG goal has been created successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'goals'] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'dashboard'] });
      router.push(`/sustainability/goals/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create goal', description: err.message, variant: 'error' });
    },
  });

  const saveDraft = async () => {
    const values = watch();
    try {
      await sustainabilityService.createGoal({ ...values, linkedSdgs: selectedSdgs, status: 'not_started' });
      toast({ title: 'Draft saved', description: 'Your goal draft has been saved.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'goals'] });
    } catch (err: any) {
      toast({ title: 'Failed to save draft', description: err.message, variant: 'error' });
    }
  };

  const toggleSdg = (id: number) => {
    setSelectedSdgs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const onSubmit = (data: GoalFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sustainability/goals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New ESG Goal</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define a measurable environmental, social, or governance goal.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Goal Details</h2>

          <Field label="Goal Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Reduce carbon emissions by 50%" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register('description')} placeholder="Describe the goal, its rationale, and scope..." rows={3} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ESG Pillar" error={errors.esgPillar?.message}>
              <select
                {...register('esgPillar')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">Select pillar...</option>
                {ESG_PILLARS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Linked Program">
              <select
                {...register('programId')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">No program</option>
                {programs?.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Targets & Measurement</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Baseline Value" error={errors.baseline?.message}>
              <Input type="number" step="any" {...register('baseline')} placeholder="e.g., 1000" />
            </Field>
            <Field label="Target Value" error={errors.targetValue?.message}>
              <Input type="number" step="any" {...register('targetValue')} placeholder="e.g., 500" />
            </Field>
            <Field label="Unit" error={errors.unit?.message}>
              <Input {...register('unit')} placeholder="e.g., tCO2e, %, kWh" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Current Value">
              <Input type="number" step="any" {...register('currentValue')} placeholder="Current progress value" />
            </Field>
            <Field label="Deadline">
              <Input type="date" {...register('deadline')} />
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Risk & Confidence</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Confidence Level" error={errors.confidence?.message}>
              <select
                {...register('confidence')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>

            <Field label="Risk Level" error={errors.riskLevel?.message}>
              <select
                {...register('riskLevel')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
          </div>

          <Field label="Linked SDGs">
            <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-lg border border-[rgb(var(--border-color))] p-3">
              {SDG_OPTIONS.map((sdg) => (
                <label key={sdg.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSdgs.includes(sdg.id)}
                    onChange={() => toggleSdg(sdg.id)}
                    className="h-4 w-4 rounded border-[rgb(var(--border-color))]"
                  />
                  <span>SDG {sdg.id}: {sdg.name}</span>
                </label>
              ))}
            </div>
          </Field>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={saveDraft} disabled={isSubmitting}>
            <FileText className="mr-2 h-4 w-4" />Save as Draft
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sustainability/goals">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Create Goal
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

