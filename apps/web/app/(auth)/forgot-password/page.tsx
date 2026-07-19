'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/modules/auth/module.validation.js';
import { authService } from '@/modules/auth/module.service.js';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await authService.forgotPassword(data);
      setDone(true);
    } catch (e) {
      setError('email', { message: (e as Error).message });
    }
  };

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Forgot password</h1>
      <p className="mb-5 text-sm text-[rgb(var(--muted))]">
        We&apos;ll send reset instructions to your email.
      </p>
      {done ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[rgb(var(--success))]">
            If the account exists, a reset link has been sent.
          </p>
          <Link href="/login" className="text-sm text-[rgb(var(--primary))] hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
          <Link href="/login" className="text-sm text-[rgb(var(--primary))] hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </Card>
  );
}
