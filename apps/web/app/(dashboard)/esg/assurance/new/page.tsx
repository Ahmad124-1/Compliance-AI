'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { ASSURANCE_TYPES } from '@/modules/esg/constants.js';

const assuranceSchema = z.object({
  assuranceType: z.string().min(1, 'Type is required'),
  scopeDescription: z.string().min(1, 'Scope is required'),
  providerName: z.string().optional(),
  providerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  assuranceDate: z.string().optional(),
  disclosureId: z.string().optional(),
});

type AssuranceFormData = z.infer<typeof assuranceSchema>;

export default function EsgAssuranceNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: disclosures } = useQuery({
    queryKey: ['esg', 'disclosures', { all: true }],
    queryFn: () => esgService.listDisclosures({ limit: '100' }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssuranceFormData>({
    resolver: zodResolver(assuranceSchema),
    defaultValues: {
      assuranceType: 'external',
      scopeDescription: '',
      providerName: '',
      providerEmail: '',
      assuranceDate: '',
      disclosureId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AssuranceFormData) =>
      esgService.createAssurance({
        assuranceType: data.assuranceType,
        scopeDescription: data.scopeDescription,
        providerName: data.providerName || undefined,
        providerEmail: data.providerEmail || undefined,
        assuranceDate: data.assuranceDate || undefined,
        disclosureId: data.disclosureId || null,
      }),
    onSuccess: (result: any) => {
      toast({ title: 'Assurance engagement created', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['esg', 'assurance'] });
      router.push(`/dashboard/esg/assurance/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create assurance', description: err.message, variant: 'error' });
    },
  });

  const onSubmit = (data: AssuranceFormData) => createMutation.mutate(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/esg/assurance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Assurance Engagement</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create a new ESG assurance engagement.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">Engagement Details</h2>

          <Field label="Assurance Type" error={errors.assuranceType?.message}>
            <select {...register('assuranceType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
              {ASSURANCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Scope" error={errors.scopeDescription?.message}>
            <Textarea {...register('scopeDescription')} rows={3} placeholder="Describe the scope of the assurance engagement..." />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provider Name">
              <Input {...register('providerName')} placeholder="e.g., Big 4 auditor" />
            </Field>
            <Field label="Provider Email" error={errors.providerEmail?.message}>
              <Input type="email" {...register('providerEmail')} placeholder="auditor@example.com" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Assurance Date">
              <Input type="date" {...register('assuranceDate')} />
            </Field>
            <Field label="Linked Disclosure">
              <select {...register('disclosureId')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                <option value="">No disclosure</option>
                {(disclosures?.disclosures ?? []).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/esg/assurance">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Create Engagement
          </Button>
        </div>
      </form>
    </div>
  );
}

