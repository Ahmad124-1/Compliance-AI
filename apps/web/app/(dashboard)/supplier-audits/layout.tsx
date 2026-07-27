'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/supplier-audits': 'Supplier Audits',
  '/dashboard/supplier-audits/new': 'New Audit',
  '/dashboard/supplier-audits/[id]': 'Audit Details',
};

export default function SupplierAuditLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Supplier Audits</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage desktop, remote, onsite, and third-party supplier audits with findings and corrective actions.</p>
      </div>
      {children}
    </div>
  );
}