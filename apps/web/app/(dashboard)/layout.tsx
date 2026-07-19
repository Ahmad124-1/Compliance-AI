import type { ReactNode } from 'react';

import { ProtectedRoute } from '@/components/guards/RouteGuard.js';
import { DashboardNav } from '@/components/layouts/DashboardNav.js';

/**
 * Dashboard route-group layout. Requires authentication.
 * DashboardNav renders the sidebar + content shell.
 */
export default function DashboardLayoutRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardNav>{children}</DashboardNav>
    </ProtectedRoute>
  );
}
