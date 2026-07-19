'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { resetPasswordSchema, type ResetPasswordInput } from '@/modules/auth/module.validation.js';
import { toResetDto } from '@/modules/auth/module.schema.js';
import { authService } from '@/modules/auth/module.service.js';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      await authService.resetPassword(toResetDto(data));
      setDone(true);
    } catch (e) {
      setError('password', { message: (e as Error).message });
    }
  };

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Reset password</h1>
      <p className="mb-5 text-sm text-[rgb(var(--muted))]">Choose a new strong password.</p>
      {done ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[rgb(var(--success))]">Password updated. You can sign in now.</p>
          <Link href="/login" className="text-sm text-[rgb(var(--primary))] hover:underline">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input type="hidden" {...register('token')} />
          <Field label="New password" error={errors.password?.message} hint="Min 10 chars, mixed case, number & symbol">
            <Input type="password" {...register('password')} />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <Input type="password" {...register('confirmPassword')} />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
