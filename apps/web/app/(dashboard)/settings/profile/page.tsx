'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { profileSchema, type ProfileInput } from '@/modules/auth/module.validation.js';
import { authService } from '@/modules/auth/module.service.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function ProfilePage() {
  const { session, hasPermission } = useAuth();
  const [saved, setSaved] = useState(false);
  const canEdit = hasPermission('profile:update', 'user:update');
  const user = session?.user;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      locale: user?.locale ?? 'en',
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    if (!session) return;
    await authService.updateProfile(session.user.id, data);
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Profile</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input disabled={!canEdit} {...register('firstName')} />
            </Field>
            <Field label="Last name">
              <Input disabled={!canEdit} {...register('lastName')} />
            </Field>
          </div>
          <Field label="Email" error={errors.avatarUrl?.message}>
            <Input value={user?.email ?? ''} disabled />
          </Field>
          <Field label="Avatar URL">
            <Input disabled={!canEdit} {...register('avatarUrl')} />
          </Field>
          <Field label="Locale">
            <Input disabled={!canEdit} {...register('locale')} />
          </Field>
          {canEdit && (
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
              {saved && <span className="text-sm text-[rgb(var(--success))]">Saved</span>}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
