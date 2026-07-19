'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { classifyError } from '@/lib/errors/classify.js';

/**
 * Centralized TanStack Query configuration.
 *
 * - Smart retry: only retry on network/5xx/429 (retryable categories).
 * - Default stale time tuned for dashboard data.
 * - Placeholder data keeps lists stable during pagination/filter changes.
 */
function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount >= 3) return false;
          const classified = classifyError(error);
          return classified.retryable;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (prev: unknown) => prev,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let client: QueryClient | undefined;

export function QueryProvider({ children }: { children: ReactNode }) {
  if (!client) client = createClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
