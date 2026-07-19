'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card.js';
import { useAudits } from '@/modules/audits/module.store.js';

export default function AuditsPage() {
  const { data: audits = [] } = useAudits();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Workspace</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Execute factory, supplier, and internal audits with a structured workspace.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {audits.map((audit: any) => (
          <Card key={audit.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{audit.title}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{audit.auditNumber} · {audit.auditType} · {audit.status}</p>
              </div>
              <div className="text-right text-sm">
                <p>{audit.progress}% complete</p>
                <Link href={`/audits/${audit.id}`} className="text-[rgb(var(--accent))] hover:underline">Open workspace</Link>
              </div>
            </div>
          </Card>
        ))}
        {audits.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No audits yet.</p>}
      </div>
    </div>
  );
}
