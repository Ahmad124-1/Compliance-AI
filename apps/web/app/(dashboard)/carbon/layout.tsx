'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/carbon': 'Carbon & GHG',
  '/carbon/dashboard': 'Dashboard',
  '/carbon/facilities': 'Facilities',
  '/carbon/emission-sources': 'Emission Sources',
  '/carbon/scopes': 'GHG Scopes',
  '/carbon/emissions': 'Emissions',
  '/carbon/emission-factors': 'Emission Factors',
  '/carbon/projects': 'Reduction Projects',
  '/carbon/offsets': 'Carbon Offsets',
  '/carbon/targets': 'Reduction Targets',
  '/carbon/reports': 'Carbon Reports',
  '/carbon/calculator': 'Calculator',
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