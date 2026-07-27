'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/supplier-esg': 'ESG Assessments',
  '/dashboard/supplier-esg/new': 'New Assessment',
  '/dashboard/supplier-esg/[id]': 'Assessment Details',
};

export default function SupplierEsgLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Supplier ESG Assessments</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Assess suppliers across environmental, social, and governance dimensions.</p>
      </div>
      {children}
    </div>
  );
}