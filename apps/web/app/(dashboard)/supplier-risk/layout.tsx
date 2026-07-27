'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/supplier-risk': 'Supplier Risk Management',
  '/dashboard/supplier-risk/[id]': 'Risk Details',
};

export default function SupplierRiskLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Supplier Risk Management</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Identify, assess, and mitigate supplier risks across child labour, forced labour, modern slavery, and environmental categories.</p>
      </div>
      {children}
    </div>
  );
}