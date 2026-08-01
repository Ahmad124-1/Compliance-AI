'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PILLARS, FINANCIAL_IMPACTS } from '@/modules/esg/constants.js';

const topicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  pillar: z.enum(['environmental', 'social', 'governance']),
  externalDrivers: z.string().optional(),
  internalDrivers: z.string().optional(),
  stakeholderGroups: z.string().optional(),
  impactScore: z.coerce.number().min(0).max(5).optional(),
  likelihoodScore: z.coerce.number().min(0).max(5).optional(),
  financialImpact: z.enum(['high', 'medium', 'low', 'negligible']).optional(),
});

type TopicFormData = z.infer<typeof topicSchema>;

export default function NewMaterialityTopicPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopicFormData>({ resolver: zodResolver(topicSchema), defaultValues: { pillar: 'environmental' } });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => esgService.createMaterialityTopic(input),
    onSuccess: (result: any) => {
      toast({ title: 'Materiality topic created', variant: 'success' });
      router.push(`/dashboard/esg/materiality/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Create failed', description: err.message, variant: 'error' });
      setSubmitting(false);
    },
  });

  const onSubmit = (data: TopicFormData) => {
    setSubmitting(true);
    createMutation.mutate({
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
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/materiality">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Materiality Topic</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define an ESG topic for materiality assessment.</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="e.g. Climate Change" {...register('name')} />
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
              <Input placeholder="e.g. Environmental / Social / Governance" {...register('category')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Impact Score (0-5)">
              <Input type="number" min={0} max={5} step="0.1" {...register('impactScore')} />
            </Field>
            <Field label="Likelihood Score (0-5)">
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
          <Field label="External Drivers (comma-separated)">
            <Input placeholder="regulatory, market, stakeholder" {...register('externalDrivers')} />
          </Field>
          <Field label="Internal Drivers (comma-separated)">
            <Input placeholder="strategy, operations, risk" {...register('internalDrivers')} />
          </Field>
          <Field label="Stakeholder Groups (comma-separated)">
            <Input placeholder="investors, customers, employees" {...register('stakeholderGroups')} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} {...register('description')} />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Topic
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

