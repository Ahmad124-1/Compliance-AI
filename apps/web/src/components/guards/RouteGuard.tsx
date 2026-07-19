'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/providers/AuthProvider.js';
import { useAuthStore } from '@/modules/auth/module.store.js';

/**
 * Route guard: redirects unauthenticated users to /login.
 * Optionally enforces permission keys (any-of).
 */
export function ProtectedRoute({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: string[];
}) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (permission && permission.length > 0 && !hasPermission(...permission)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, hasPermission, permission, router]);

  if (isLoading || !isAuthenticated) return null;
  if (permission && permission.length > 0 && !hasPermission(...permission)) return null;
  return <>{children}</>;
}

/**
 * Guards a single element by permission. Renders nothing if not permitted.
 */
export function Can({
  permission,
  children,
}: {
  permission: string | string[];
  children: ReactNode;
}) {
  const { hasPermission } = useAuth();
  const keys = Array.isArray(permission) ? permission : [permission];
  return hasPermission(...keys) ? <>{children}</> : null;
}

export { useAuthStore };
