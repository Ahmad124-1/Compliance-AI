'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/supplier-carbon': 'Supplier Carbon Performance',
  '/dashboard/supplier-carbon/[id]': 'Carbon Details',
};

export default function SupplierCarbonLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Supplier Carbon Performance</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Track supplier Scope 1, 2, and 3 emissions, reduction projects, and carbon targets.</p>
      </div>
      {children}
    </div>
  );
}