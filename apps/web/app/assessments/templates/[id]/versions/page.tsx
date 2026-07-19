'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { EmptyState } from '@/components/ui/states.js';
import { useVersions } from '@/modules/assessments/module.store.js';

export default function TemplateVersionsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: versions, isLoading, isError } = useVersions(id);

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading versions…</p>;
  if (isError || !versions) return <EmptyState title="Unable to load versions" description="Check the template ID and try again." />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/assessments/templates/${id}`}><Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-semibold">Version History</h1>
          <p className="text-xs text-[rgb(var(--muted))]">Template · {id}</p>
        </div>
      </div>

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {versions.map((v) => (
          <div key={v.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Version {v.version}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{new Date(v.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-1">
              {v.changeSummary && <p className="text-xs text-[rgb(var(--muted))]">{v.changeSummary}</p>}
              <p className="text-xs text-[rgb(var(--muted))]">Created by {v.createdBy ?? 'unknown'}</p>
            </div>
          </div>
        ))}
        {versions.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No versions yet.</p>}
      </Card>
    </div>
  );
}
