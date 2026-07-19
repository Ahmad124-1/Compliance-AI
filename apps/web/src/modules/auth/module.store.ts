'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { authService } from './module.service.js';
import type { Session } from './module.types.js';

interface AuthState {
  session: Session | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: Parameters<typeof authService.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setSession: (session: Session) => void;
  clear: () => void;
  hasPermission: (...keys: string[]) => boolean;
  hasRole: (...keys: string[]) => boolean;
}

/**
 * Auth store. Persists the session for hydration across reloads.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      status: 'idle',
      error: null,

      setSession: (session) => set({ session, status: 'authenticated', error: null }),

      clear: () => set({ session: null, status: 'unauthenticated', error: null }),

      login: async (email, password) => {
        set({ status: 'loading', error: null });
        try {
          const session = await authService.login({ email, password });
          set({ session, status: 'authenticated' });
        } catch (e) {
          set({ status: 'unauthenticated', error: (e as Error).message });
          throw e;
        }
      },

      register: async (input) => {
        set({ status: 'loading', error: null });
        try {
          const session = await authService.register(input);
          set({ session, status: 'authenticated' });
        } catch (e) {
          set({ status: 'unauthenticated', error: (e as Error).message });
          throw e;
        }
      },

      logout: async () => {
        await authService.logout();
        set({ session: null, status: 'unauthenticated' });
      },

      refresh: async () => {
        const session = await authService.refresh();
        if (session) {
          set({ session, status: 'authenticated' });
          return true;
        }
        set({ session: null, status: 'unauthenticated' });
        return false;
      },

      hasPermission: (...keys) => {
        const perms = get().session?.permissions ?? [];
        return keys.some((k) => perms.includes(k));
      },

      hasRole: (...keys) => {
        const roles = get().session?.roles ?? [];
        return keys.some((k) => roles.includes(k));
      },
    }),
    {
      name: 'cos.auth',
      partialize: (s) => ({ session: s.session, status: s.session ? 'authenticated' : 'unauthenticated' }),
    },
  ),
);
