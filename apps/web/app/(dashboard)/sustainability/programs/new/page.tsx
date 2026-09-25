'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, FileText, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { PROGRAM_CATEGORIES, ESG_PILLARS } from '@/modules/sustainability/constants.js';

const programSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().positive('Budget must be positive').nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  linkedSdgs: z.array(z.number()).default([]),
  linkedEsgPillars: z.array(z.enum(['environment', 'social', 'governance'])).default([]),
  status: z.string().default('draft'),
});

type ProgramFormData = z.infer<typeof programSchema>;

const SDG_OPTIONS = [
  { id: 1, name: 'No Poverty' },
  { id: 2, name: 'Zero Hunger' },
  { id: 3, name: 'Good Health and Well-being' },
  { id: 4, name: 'Quality Education' },
  { id: 5, name: 'Gender Equality' },
  { id: 6, name: 'Clean Water and Sanitation' },
  { id: 7, name: 'Affordable and Clean Energy' },
  { id: 8, name: 'Decent Work and Economic Growth' },
  { id: 9, name: 'Industry, Innovation and Infrastructure' },
  { id: 10, name: 'Reduced Inequalities' },
  { id: 11, name: 'Sustainable Cities and Communities' },
  { id: 12, name: 'Responsible Consumption and Production' },
  { id: 13, name: 'Climate Action' },
  { id: 14, name: 'Life Below Water' },
  { id: 15, name: 'Life on Land' },
  { id: 16, name: 'Peace, Justice and Strong Institutions' },
  { id: 17, name: 'Partnerships for the Goals' },
];

export default function ProgramNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      priority: 'medium',
      status: 'draft',
      linkedSdgs: [],
      linkedEsgPillars: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProgramFormData) =>
      sustainabilityService.createProgram({
        ...data,
        linkedSdgs: selectedSdgs,
        linkedEsgPillars: selectedPillars,
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Program created', description: 'Your program has been created successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'dashboard'] });
      router.push(`/sustainability/programs/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create program', description: err.message, variant: 'error' });
    },
  });

  const saveDraft = async () => {
    const values = watch();
    try {
      await sustainabilityService.createProgram({ ...values, linkedSdgs: selectedSdgs, linkedEsgPillars: selectedPillars, status: 'draft' });
      toast({ title: 'Draft saved', description: 'Your program draft has been saved.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] });
    } catch (err: any) {
      toast({ title: 'Failed to save draft', description: err.message, variant: 'error' });
    }
  };

  const toggleSdg = (id: number) => {
    setSelectedSdgs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const togglePillar = (pillar: string) => {
    setSelectedPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    );
  };

  const onSubmit = (data: ProgramFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sustainability/programs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Program</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create a new sustainability program.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Basic Information</h2>

          <Field label="Program Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Net Zero 2030 Program" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register('description')} placeholder="Describe the program's objectives and scope..." rows={4} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <select
                {...register('category')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="">Select category...</option>
                {PROGRAM_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority" error={errors.priority?.message}>
              <select
                {...register('priority')}
                className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start Date">
              <Input type="date" {...register('startDate')} />
            </Field>
            <Field label="End Date">
              <Input type="date" {...register('endDate')} />
            </Field>
          </div>

          <Field label="Budget" error={errors.budget?.message}>
            <Input type="number" step="0.01" min="0" {...register('budget')} placeholder="e.g., 500000" />
          </Field>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">ESG Alignment</h2>

          <Field label="ESG Pillars">
            <div className="flex flex-wrap gap-2">
              {ESG_PILLARS.map((pillar) => (
                <button
                  key={pillar.value}
                  type="button"
                  onClick={() => togglePillar(pillar.value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedPillars.includes(pillar.value)
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]'
                      : 'border-[rgb(var(--border-color))] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]'
                  }`}
                >
                  {pillar.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Linked Sustainable Development Goals (SDGs)">
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
          <div>
            <Button type="button" variant="outline" onClick={saveDraft} disabled={isSubmitting}>
              <FileText className="mr-2 h-4 w-4" />Save as Draft
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sustainability/programs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Create Program
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

