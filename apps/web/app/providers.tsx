import type { ReactNode } from 'react';
import { Providers } from '@/providers/Providers';

/**
 * Next.js App Router providers wrapper.
 *
 * This file exists to support the conventional `app/providers.tsx` import pattern.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}

