'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { reportConcernSchema, type ReportConcernInput } from '@/modules/worker-voice/module.validation.js';
import { useReportConcern } from '@/modules/worker-voice/module.store.js';
import { WORKER_VOICE_CATEGORIES } from '@/modules/worker-voice/module.constants.js';
import type { WorkerVoiceCase } from '@/modules/worker-voice/module.types.js';

export default function ReportConcernPage() {
  const router = useRouter();
  const report = useReportConcern();
  const [submitted, setSubmitted] = useState<{ trackingNumber?: string; trackingPIN?: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportConcernInput>({
    resolver: zodResolver(reportConcernSchema),
    defaultValues: { anonymous: true, language: 'en' },
  });

  const onSubmit = async (data: ReportConcernInput) => {
    try {
      const result = await report.mutateAsync(data);
      setSubmitted({ trackingNumber: (result as WorkerVoiceCase).caseNumber, trackingPIN: (result as WorkerVoiceCase).id });
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <h1 className="mb-2 text-xl font-semibold text-green-600">Concern Reported</h1>
          <p className="mb-4 text-sm text-[rgb(var(--muted))]">
            Your concern has been submitted. Please save your reference details if you need to follow up.
          </p>
          <div className="mb-4 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Case Reference</p>
                <p className="text-lg font-mono font-semibold">{submitted.trackingNumber ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Case ID</p>
                <p className="text-sm font-mono">{submitted.trackingPIN ?? 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/worker-voice/my-cases')}>My Cases</Button>
            <Button variant="ghost" onClick={() => setSubmitted(null)}>Report Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Report a Concern</h1>
      <p className="mb-6 text-sm text-[rgb(var(--muted))]">
        Your report is confidential. You may choose to remain anonymous.
      </p>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" error={errors.title?.message}>
            <Input {...register('title')} placeholder="Brief summary of the issue" />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('category')}>
              <option value="">— select —</option>
              {WORKER_VOICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <textarea
              className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              rows={4}
              {...register('description')}
              placeholder="Please describe your concern in detail..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" error={errors.location?.message}>
              <Input {...register('location')} placeholder="Optional" />
            </Field>
            <Field label="Department" error={errors.department?.message}>
              <Input {...register('department')} placeholder="Optional" />
            </Field>
          </div>
          <Field label="Language" error={errors.language?.message}>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('language')}>
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Name (optional)" error={errors.reporterName?.message}>
              <Input {...register('reporterName')} placeholder="Optional" />
            </Field>
            <Field label="Email (optional)" error={errors.reporterEmail?.message}>
              <Input type="email" {...register('reporterEmail')} placeholder="Optional" />
            </Field>
          </div>
          <Field label="Phone (optional)" error={errors.reporterPhone?.message}>
            <Input {...register('reporterPhone')} placeholder="Optional" />
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="anonymous" className="h-4 w-4 rounded" {...register('anonymous')} />
            <label htmlFor="anonymous" className="text-sm text-[rgb(var(--text))]">Submit anonymously</label>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Report'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
