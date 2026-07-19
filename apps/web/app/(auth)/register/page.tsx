'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { registerSchema, type RegisterInput } from '@/modules/auth/module.validation.js';
import { toRegisterDto } from '@/modules/auth/module.schema.js';
import { useAuthStore } from '@/modules/auth/module.store.js';

export default function RegisterPage() {
  const registerUser = useAuthStore((s) => s.register);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(toRegisterDto(data));
      router.replace('/dashboard');
    } catch (e) {
      setError('email', { message: (e as Error).message });
    }
  };

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Create your organization</h1>
      <p className="mb-5 text-sm text-[rgb(var(--muted))]">Start a new ComplianceOS tenant</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Organization name" error={errors.organizationName?.message}>
          <Input {...register('organizationName')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName?.message}>
            <Input {...register('firstName')} />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <Input {...register('lastName')} />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="Min 10 chars, mixed case, number & symbol">
          <Input type="password" {...register('password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <Input type="password" {...register('confirmPassword')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create organization'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[rgb(var(--muted))]">
        Already registered?{' '}
        <Link href="/login" className="text-[rgb(var(--primary))] hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
