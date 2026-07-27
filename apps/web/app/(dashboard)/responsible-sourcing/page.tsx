'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, Search, Shield } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { responsibleSourcingService } from '@/modules/responsible-sourcing/service.js';

export default function ResponsibleSourcingPage() {
  const { session } = useAuth();

  const { data: materials, isLoading: mLoading, refetch: refetchMaterials } = useQuery({
    queryKey: ['responsible-materials', session?.organization.id],
    queryFn: () => responsibleSourcingService.listMaterials({ limit: '100' }).then((r) => r.materials ?? r),
  });

  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ['sourcing-summary', session?.organization.id],
    queryFn: () => responsibleSourcingService.getSourcingSummary(),
  });

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of materials ?? []) {
      map.set(m.materialCategory, (map.get(m.materialCategory) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [materials]);

  const loading = mLoading || sLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Shield className="h-6 w-6 text-[rgb(var(--primary))]" />
          Responsible Sourcing
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Track raw materials, traceability, conflict minerals, and supply chain compliance.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Materials" value={summary?.totalMaterials ?? materials?.length ?? 0} />
          <StatTile label="Conflict-Free Rate" value={`${summary?.conflictFreeRate ?? 0}%`} />
          <StatTile label="Traceability Rate" value={`${summary?.traceabilityRate ?? 0}%`} />
          <StatTile label="CoC Verified" value={summary?.chainOfCustodyVerified ?? 0} />
        </div>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Materials by Category</h2>
        {loading ? <Skeleton className="h-48" /> : byCategory.length ? <BarChart data={byCategory} /> : <EmptyState title="No category data" />}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Tracked Materials</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : materials?.length === 0 ? (
          <EmptyState title="No materials" description="Add materials to track responsible sourcing compliance." />
        ) : (
          <div className="space-y-2">
            {materials?.slice(0, 10).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{m.materialName}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{m.materialCategory} · {m.countryOfOrigin ?? 'N/A'}</p>
                </div>
                <span className={`font-semibold ${m.traceabilityStatus === 'full' ? 'text-green-500' : m.traceabilityStatus === 'partial' ? 'text-yellow-500' : 'text-red-500'}`}>{m.traceabilityStatus}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}