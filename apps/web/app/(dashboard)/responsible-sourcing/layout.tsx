'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/responsible-sourcing': 'Responsible Sourcing',
  '/dashboard/responsible-sourcing/[id]': 'Material Details',
};

export default function ResponsibleSourcingLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Responsible Sourcing</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Monitor raw materials, traceability, conflict minerals, and supply chain mapping.</p>
      </div>
      {children}
    </div>
  );
}