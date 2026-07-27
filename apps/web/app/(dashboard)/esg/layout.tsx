'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/esg': 'ESG Reporting & Disclosure',
  '/dashboard/esg/frameworks': 'Frameworks',
  '/dashboard/esg/metrics': 'Metrics',
  '/dashboard/esg/periods': 'Reporting Periods',
  '/dashboard/esg/data-points': 'Data Points',
  '/dashboard/esg/materiality': 'Materiality',
  '/dashboard/esg/disclosures': 'Disclosures',
  '/dashboard/esg/reports': 'Reports',
  '/dashboard/esg/assurance': 'Assurance',
};

export default function EsgLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">ESG Reporting & Disclosure</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage frameworks, metrics, disclosures, reports, and assurance.</p>
      </div>
      {children}
    </div>
  );
}
