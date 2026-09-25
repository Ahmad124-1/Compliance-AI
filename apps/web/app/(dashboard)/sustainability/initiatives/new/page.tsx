'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, FileText, Send, Plus, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { masterDataLookup } from '@/modules/data-hub/service.js';
import { INITIATIVE_STATUSES } from '@/modules/sustainability/constants.js';
import { useAutoFill } from '@/modules/auto-populate/hooks/useAutoFill';

const initiativeSchema = z.object({
  programId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.coerce.number().positive('Budget must be positive').nullable().optional(),
  expectedImpact: z.string().optional(),
  actualImpact: z.string().optional(),
  status: z.string().default('planning'),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  linkedSdgs: z.array(z.number()).default([]),
});

type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface MilestoneEntry {
  key: string;
  name: string;
  description: string;
  dueDate: string;
}

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

export default function InitiativeNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);

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
  } = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      riskLevel: 'medium',
      linkedSdgs: [],
    },
  });
  const { useSetDefaults } = useAutoFill({});
  useSetDefaults(setValue, [{ name: 'programId', fillKey: 'programId' }, { name: 'goalId', fillKey: 'goalId' }, { name: 'kpiId', fillKey: 'kpiId' }, { name: 'reportingPeriodId', fillKey: 'reportingPeriodId' }, { name: 'facilityId', fillKey: 'facilityId' }, { name: 'projectId', fillKey: 'projectId' }, { name: 'supplierIds', fillKey: 'supplierIds' }]);

  const createMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      const initiative = await sustainabilityService.createInitiative({
        ...data,
        programId: data.programId || null,
        linkedSdgs: selectedSdgs,
      });
      if (milestones.length > 0) {
        for (const m of milestones) {
          await sustainabilityService.createMilestone({
            initiativeId: initiative.id,
            name: m.name,
            description: m.description || undefined,
            dueDate: m.dueDate || undefined,
            sortOrder: milestones.indexOf(m),
          });
        }
      }
      return initiative;
    },
    onSuccess: (result: any) => {
      toast({ title: 'Initiative created', description: 'Your initiative has been created successfully with milestones.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'dashboard'] });
      router.push(`/sustainability/initiatives/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create initiative', description: err.message, variant: 'error' });
    },
  });

  const saveDraft = async () => {
    const values = watch();
    try {
      await sustainabilityService.createInitiative({ ...values, linkedSdgs: selectedSdgs, status: 'planning' });
      toast({ title: 'Draft saved', description: 'Your initiative draft has been saved.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'initiatives'] });
    } catch (err: any) {
      toast({ title: 'Failed to save draft', description: err.message, variant: 'error' });
    }
  };

  const toggleSdg = (id: number) => {
    setSelectedSdgs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { key: crypto.randomUUID(), name: '', description: '', dueDate: '' },
    ]);
  };

  const removeMilestone = (key: string) => {
    setMilestones((prev) => prev.filter((m) => m.key !== key));
  };

  const updateMilestone = (key: string, field: keyof MilestoneEntry, value: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.key === key ? { ...m, [field]: value } : m))
    );
  };

  const onSubmit = (data: InitiativeFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sustainability/initiatives">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Initiative</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create a new sustainability initiative with milestones.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Initiative Details</h2>

          <Field label="Initiative Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Solar Panel Installation Program" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register('description')} placeholder="Describe the initiative's objectives and approach..." rows={3} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
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

            <Field label="Status">
              <select
                {...register('status')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                {INITIATIVE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Team / Assignee">
            <Input {...register('team')} placeholder="e.g., Sustainability Team, John Doe" />
          </Field>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Timeline & Budget</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start Date">
              <Input type="date" {...register('startDate')} />
            </Field>
            <Field label="Due Date">
              <Input type="date" {...register('dueDate')} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Budget" error={errors.budget?.message}>
              <Input type="number" step="0.01" min="0" {...register('budget')} placeholder="e.g., 250000" />
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

          <Field label="Expected Impact">
            <Textarea {...register('expectedImpact')} placeholder="Describe the expected environmental/social impact..." rows={2} />
          </Field>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Linked SDGs</h2>
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
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Milestones</h2>
            <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
              <Plus className="mr-1 h-3 w-3" />Add Milestone
            </Button>
          </div>

          {milestones.length === 0 && (
            <p className="text-sm text-[rgb(var(--muted))]">No milestones added yet. Milestones help track progress.</p>
          )}

          {milestones.map((milestone, index) => (
            <div key={milestone.key} className="rounded-lg border border-[rgb(var(--border-color))] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[rgb(var(--muted))]">Milestone {index + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMilestone(milestone.key)}>
                  <Trash2 className="h-3 w-3 text-[rgb(var(--danger))]" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Milestone name"
                    value={milestone.name}
                    onChange={(e) => updateMilestone(milestone.key, 'name', e.target.value)}
                  />
                </div>
                <Input
                  type="date"
                  value={milestone.dueDate}
                  onChange={(e) => updateMilestone(milestone.key, 'dueDate', e.target.value)}
                />
              </div>
              <Input
                placeholder="Description (optional)"
                value={milestone.description}
                onChange={(e) => updateMilestone(milestone.key, 'description', e.target.value)}
              />
            </div>
          ))}
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={saveDraft} disabled={isSubmitting}>
            <FileText className="mr-2 h-4 w-4" />Save as Draft
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sustainability/initiatives">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Create Initiative
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

