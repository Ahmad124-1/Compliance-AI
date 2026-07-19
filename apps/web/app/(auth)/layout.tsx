import type { ReactNode } from 'react';
import { AuthLayout } from '@/components/layouts/AuthLayout';

/**
 * Auth route-group layout.
 * Structural only.
 */
export default function AuthLayoutRoute({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}

