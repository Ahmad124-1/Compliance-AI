import type { ReactNode } from 'react';

/**
 * Dashboard layout wrapper.
 * Structural only; no auth/business logic.
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 py-6">{children}</div>
    </div>
  );
}

