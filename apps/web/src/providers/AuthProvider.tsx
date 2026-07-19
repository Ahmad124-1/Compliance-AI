'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import { useAuthStore } from '@/modules/auth/module.store.js';
import type { Session } from '@/modules/auth/module.types.js';

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (...keys: string[]) => boolean;
  hasRole: (...keys: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Wires the Zustand auth store into React context and performs an
 * initial token refresh on mount.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);

  useEffect(() => {
    const token = session?.accessToken;
    if (token && status === 'idle') {
      refresh();
    } else if (!token && status === 'idle') {
      useAuthStore.setState({ status: 'unauthenticated' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading: status === 'loading' || status === 'idle',
      hasPermission,
      hasRole,
      login,
      logout,
      refresh,
    }),
    [session, status, hasPermission, hasRole, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
