'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { loginSchema, type LoginInput } from '@/modules/auth/module.validation.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
      router.replace('/dashboard');
    } catch (e) {
      setError('password', { message: (e as Error).message });
    }
  };

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
      <p className="mb-5 text-sm text-[rgb(var(--muted))]">Access your ComplianceOS workspace</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-[rgb(var(--primary))] hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[rgb(var(--muted))]">
        No account?{' '}
        <Link href="/register" className="text-[rgb(var(--primary))] hover:underline">
          Create organization
        </Link>
      </p>
    </Card>
  );
}
