'use client';

import type { ReactNode } from 'react';

import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary.js';

/**
 * App-level provider composition.
 */
export function Providers({ children }: { children?: ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
