'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { useAudit, useAuditMutations } from '@/modules/audits/module.store.js';

export default function AuditWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { data: audit, isLoading } = useAudit(id);
  const { start, complete } = useAuditMutations();

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading workspace…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{audit?.audit?.title ?? 'Audit Workspace'}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Structured execution workspace with sections, evidence, interviews, findings, and signatures.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-[rgb(var(--muted))]">Status</p>
          <p className="text-lg font-semibold">{audit?.audit?.status ?? 'draft'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[rgb(var(--muted))]">Progress</p>
          <p className="text-lg font-semibold">{audit?.progress?.completionPercentage ?? 0}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[rgb(var(--muted))]">Sections</p>
          <p className="text-lg font-semibold">{audit?.sections?.length ?? 0}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Execution controls</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => start.mutate(id)}>Start audit</button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => complete.mutate(id)}>Complete audit</button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Checklist sections</h2>
        <div className="space-y-2">
          {audit?.sections?.map((section: any) => (
            <div key={section.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{section.title}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{section.progress}%</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
