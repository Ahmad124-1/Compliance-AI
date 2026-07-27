'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/sustainability': 'Sustainability',
  '/dashboard/sustainability/programs': 'Programs',
  '/dashboard/sustainability/goals': 'Goals',
  '/dashboard/sustainability/kpis': 'KPIs',
  '/dashboard/sustainability/initiatives': 'Initiatives',
  '/dashboard/sustainability/reports': 'Reports',
  '/dashboard/sustainability/settings': 'Settings',
};

export default function SustainabilityLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Sustainability</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage programs, ESG goals, KPIs, initiatives, and reporting.</p>
      </div>
      {children}
    </div>
  );
}