'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { useStandard, useStandardFrameworks, useEnableFramework } from '@/modules/standards/module.store.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function StandardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: standard, isLoading } = useStandard(id);
  const { data: frameworks } = useStandardFrameworks(id);
  const enableFw = useEnableFramework();
  const { hasPermission } = useAuth();

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;
  if (!standard) return <p className="text-sm text-[rgb(var(--muted))]">Standard not found.</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{standard.name}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {standard.code} · {standard.publisher ?? '—'} · {standard.category ?? '—'}
        </p>
        {standard.description && <p className="mt-2 text-sm">{standard.description}</p>}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Frameworks</h2>
      </div>

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {frameworks?.map((fw) => (
          <div key={fw.id} className="flex items-center justify-between p-4">
            <div>
              <Link href={`/standards/frameworks/${fw.id}`} className="text-sm font-medium hover:underline">
                {fw.title}
              </Link>
              <p className="text-xs text-[rgb(var(--muted))]">v{fw.version} · {fw.status}</p>
            </div>
            {hasPermission('framework:assign') && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => enableFw.mutate(fw.id)}>
                  Enable
                </Button>
              </div>
            )}
          </div>
        ))}
        {frameworks?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No frameworks for this standard.</p>}
      </Card>
    </div>
  );
}
