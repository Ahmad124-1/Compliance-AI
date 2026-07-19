import type { ReactNode } from 'react';
import { CenteredLayout } from '@/components/layouts/CenteredLayout';

/**
 * Landing route-group layout.
 * Structural only.
 */
export default function LandingLayoutRoute({
  children,
}: {
  children: ReactNode;
}) {
  return <CenteredLayout>{children}</CenteredLayout>;
}

