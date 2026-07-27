'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard/suppliers': 'Suppliers',
  '/dashboard/suppliers/new': 'New Supplier',
  '/dashboard/suppliers/[id]': 'Supplier Details',
};

export default function SuppliersLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Supplier Management</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage supplier profiles, facilities, contacts, and business relationships.</p>
      </div>
      {children}
    </div>
  );
}