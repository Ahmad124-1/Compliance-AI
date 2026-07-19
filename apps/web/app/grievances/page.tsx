'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { grievanceSubmitSchema } from '@/modules/grievances/module.validation.js';
import type { GrievanceSubmitInput } from '@/modules/grievances/module.types.js';
import { useSubmitGrievance, useGrievanceCategories, useGrievanceLanguages } from '@/modules/grievances/module.store.js';

export default function SubmitGrievancePage() {
  const router = useRouter();
  const submit = useSubmitGrievance();
  const { data: categories } = useGrievanceCategories();
  const { data: languages } = useGrievanceLanguages();

  const [submitted, setSubmitted] = useState<{ trackingNumber: string; trackingPIN: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GrievanceSubmitInput>({
    resolver: zodResolver(grievanceSubmitSchema),
    defaultValues: { anonymous: true, language: 'en' },
  });

  const onSubmit = async (data: GrievanceSubmitInput) => {
    try {
      const result = await submit.mutateAsync(data);
      setSubmitted({ trackingNumber: result.trackingNumber, trackingPIN: result.trackingPIN });
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <h1 className="mb-2 text-xl font-semibold text-green-600">Grievance Submitted</h1>
          <p className="mb-4 text-sm text-[rgb(var(--muted))]">
            Please save your tracking details. You will need them to check the status of your grievance.
          </p>
          <div className="mb-4 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Tracking Number</p>
                <p className="text-lg font-mono font-semibold">{submitted.trackingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Tracking PIN</p>
                <p className="text-lg font-mono font-semibold">{submitted.trackingPIN}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/track-grievance')}>Track Grievance</Button>
            <Button variant="ghost" onClick={() => setSubmitted(null)}>Submit Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Submit a Grievance</h1>
      <p className="mb-6 text-sm text-[rgb(var(--muted))]">
        Your report is confidential. You may choose to remain anonymous.
      </p>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input type="hidden" {...register('source')} value="website" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" error={errors.category?.message}>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('category')}>
                <option value="">— select —</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.code}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Language" error={errors.language?.message}>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('language')}>
                {languages?.map((l) => (
                  <option key={l.id} value={l.code}>{l.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Title" error={errors.title?.message}>
            <Input {...register('title')} placeholder="Brief summary of the issue" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea
              className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              rows={4}
              {...register('description')}
              placeholder="Please describe your grievance in detail..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Severity" error={errors.severity?.message}>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('severity')}>
                <option value="">— select —</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
            <Field label="Factory / Location" error={errors.factory?.message}>
              <Input {...register('factory')} placeholder="Optional" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" error={errors.department?.message}>
              <Input {...register('department')} placeholder="Optional" />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <Input {...register('location')} placeholder="Optional" />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="anonymous" className="h-4 w-4 rounded" {...register('anonymous')} />
            <label htmlFor="anonymous" className="text-sm text-[rgb(var(--text))]">Submit anonymously</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Name" error={errors.reporterName?.message}>
              <Input {...register('reporterName')} placeholder="Optional" />
            </Field>
            <Field label="Email" error={errors.reporterEmail?.message}>
              <Input type="email" {...register('reporterEmail')} placeholder="Optional" />
            </Field>
          </div>

          <Field label="Phone" error={errors.reporterPhone?.message}>
            <Input {...register('reporterPhone')} placeholder="Optional" />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Grievance'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
