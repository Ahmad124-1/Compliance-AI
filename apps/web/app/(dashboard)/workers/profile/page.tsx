'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Award, Briefcase, Languages, Shield } from 'lucide-react';

import { Button, Card, Field, Input, Textarea, Skeleton, ErrorState } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useWorkerProfile, useCreateProfile } from '@/modules/worker-platform/store.js';
import { profileUpdateSchema } from '@/modules/worker-platform/validation.js';

export default function ProfilePage() {
  const { toast } = useToast();
  const { data: profile, isLoading, error, refetch } = useWorkerProfile();
  const update = useCreateProfile();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      position: profile?.position ?? '',
      bio: profile?.bio ?? '',
      languages: profile?.languages ?? [],
      skills: profile?.skills ?? [],
      emergencyContactName: profile?.emergencyContactName ?? '',
      emergencyContactPhone: profile?.emergencyContactPhone ?? '',
      emergencyContactRelation: profile?.emergencyContactRelation ?? '',
    },
  });

  if (error) return <ErrorState title="Failed to load profile" message={String(error)} onRetry={() => refetch()} />;

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await update.mutateAsync(data);
      toast({ title: 'Profile updated', variant: 'success' });
      setEditing(false);
    } catch (e) {
      toast({ title: 'Update failed', description: String(e), variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        {!editing && <Button size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input value={profile?.email ?? ''} disabled />
              </Field>
              <Field label="Position" error={errors.position?.message}>
                <Input {...register('position')} disabled={!editing} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio" error={errors.bio?.message}>
                  <Textarea rows={3} {...register('bio')} disabled={!editing} />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Employment Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee ID">
                <Input value={profile?.employeeId ?? '—'} disabled />
              </Field>
              <Field label="Employment Type">
                <Input value={profile?.employmentType ?? '—'} disabled />
              </Field>
              <Field label="Join Date">
                <Input value={profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '—'} disabled />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Languages className="h-5 w-5 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Languages & Skills</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Languages">
                <Input value={(profile?.languages ?? []).join(', ')} disabled placeholder="English, Spanish, Hindi" />
              </Field>
              <Field label="Skills">
                <Input value={(profile?.skills ?? []).join(', ')} disabled placeholder="Welding, QA, Leadership" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Emergency Contacts</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Contact Name" error={errors.emergencyContactName?.message}>
                <Input {...register('emergencyContactName')} disabled={!editing} />
              </Field>
              <Field label="Phone" error={errors.emergencyContactPhone?.message}>
                <Input {...register('emergencyContactPhone')} disabled={!editing} />
              </Field>
              <Field label="Relation" error={errors.emergencyContactRelation?.message}>
                <Input {...register('emergencyContactRelation')} disabled={!editing} />
              </Field>
            </div>
          </Card>

          {editing && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
