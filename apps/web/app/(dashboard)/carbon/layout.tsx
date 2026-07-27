'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/carbon': 'Carbon & GHG',
  '/dashboard/carbon/dashboard': 'Dashboard',
  '/dashboard/carbon/facilities': 'Facilities',
  '/dashboard/carbon/emission-sources': 'Emission Sources',
  '/dashboard/carbon/scopes': 'GHG Scopes',
  '/dashboard/carbon/emissions': 'Emissions',
  '/dashboard/carbon/emission-factors': 'Emission Factors',
  '/dashboard/carbon/projects': 'Reduction Projects',
  '/dashboard/carbon/offsets': 'Carbon Offsets',
  '/dashboard/carbon/targets': 'Reduction Targets',
  '/dashboard/carbon/reports': 'Carbon Reports',
  '/dashboard/carbon/calculator': 'Calculator',
};

export default function CarbonLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Carbon &amp; GHG</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage carbon accounting, GHG inventories, reduction projects, and offsets.</p>
      </div>
      {children}
    </div>
  );
}