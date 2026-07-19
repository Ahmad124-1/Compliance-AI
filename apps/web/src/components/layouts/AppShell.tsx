'use client';

import type { ReactNode } from 'react';

/**
 * Generic app shell placeholder.
 *
 * Future versions will include Sidebar + TopNav composition.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}

