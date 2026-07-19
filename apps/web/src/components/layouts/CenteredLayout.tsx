import type { ReactNode } from 'react';

/**
 * Generic centered layout.
 */
export function CenteredLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}

