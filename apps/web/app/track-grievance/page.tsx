'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import type { GrievanceTrackInput } from '@/modules/grievances/module.types.js';
import { useTrackGrievance } from '@/modules/grievances/module.store.js';
import { GRIEVANCE_STATUS_LABELS, GRIEVANCE_PRIORITY_LABELS } from '@/modules/grievances/module.constants.js';

export default function TrackGrievancePage() {
  const router = useRouter();
  const track = useTrackGrievance();
  const [result, setResult] = useState<{ trackingNumber: string; status: string; priority: string; category: string; createdAt: string; updatedAt: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GrievanceTrackInput>();

  const onSubmit = async (data: GrievanceTrackInput) => {
    try {
      const res = await track.mutateAsync(data);
      if (res.found) {
        setResult({
          trackingNumber: res.trackingNumber ?? '',
          status: res.status ?? '',
          priority: res.priority ?? '',
          category: res.category ?? '',
          createdAt: res.createdAt ?? '',
          updatedAt: res.updatedAt ?? '',
        });
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch (e) {
      console.error(e);
      setNotFound(true);
      setResult(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Track Your Grievance</h1>
      <p className="mb-6 text-sm text-[rgb(var(--muted))]">
        Enter your tracking number and PIN to check the status of your grievance.
      </p>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tracking Number" error={errors.trackingNumber?.message}>
              <Input {...register('trackingNumber')} placeholder="WV-XXXXXX" />
            </Field>
            <Field label="PIN" error={errors.trackingPIN?.message}>
              <Input {...register('trackingPIN')} placeholder="XXXXXX" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Tracking…' : 'Track'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push('/grievances')}>
              Submit New
            </Button>
          </div>
        </form>

        {notFound && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No grievance found with the provided tracking number and PIN. Please check your details and try again.
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4">
            <h3 className="mb-3 text-sm font-medium">Grievance Status</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Tracking Number</p>
                <p className="font-mono font-semibold">{result.trackingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Category</p>
                <p className="font-medium">{result.category}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Status</p>
                <p className="font-medium">{GRIEVANCE_STATUS_LABELS[result.status] ?? result.status}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Priority</p>
                <p className="font-medium">{GRIEVANCE_PRIORITY_LABELS[result.priority] ?? result.priority}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Submitted</p>
                <p className="font-medium">{new Date(result.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Last Updated</p>
                <p className="font-medium">{new Date(result.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
