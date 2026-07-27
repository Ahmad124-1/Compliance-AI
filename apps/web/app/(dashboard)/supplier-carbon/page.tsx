'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Leaf, TrendingDown, Bolt, Droplets, Recycle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, LineChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { supplierCarbonService } from '@/modules/supplier-carbon/service.js';

export default function SupplierCarbonPage() {
  const { session } = useAuth();

  const { data: records, isLoading: rLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['supplier-carbon-records', session?.organization.id],
    queryFn: () => supplierCarbonService.listCarbonRecords({ limit: '100' }).then((r) => r.records ?? r),
  });

  const byScope = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records ?? []) {
      map.set(r.scope, (map.get(r.scope) ?? 0) + (r.emissionValue ?? 0));
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value: Math.round(value) }));
  }, [records]);

  const loading = rLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Leaf className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Carbon Performance
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Monitor supplier emissions across Scope 1, 2, and 3 with reduction tracking.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Records" value={records?.length ?? 0} />
          <StatTile label="Scope 1" value={`${byScope.find((s) => s.label === 'scope_1')?.value ?? 0} tCO2e`} />
          <StatTile label="Scope 2" value={`${byScope.find((s) => s.label === 'scope_2')?.value ?? 0} tCO2e`} />
          <StatTile label="Scope 3" value={`${byScope.find((s) => s.label === 'scope_3')?.value ?? 0} tCO2e`} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Emissions by Scope</h2>
          {loading ? <Skeleton className="h-48" /> : byScope.length ? <BarChart data={byScope} /> : <EmptyState title="No scope data" />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Emission Trends</h2>
          {loading ? <Skeleton className="h-48" /> : (
            <EmptyState title="No trend data" description="Emission trends will appear as records are added." />
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Carbon Records</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : records?.length === 0 ? (
          <EmptyState title="No carbon records" description="Emission records will appear as suppliers report their carbon data." />
        ) : (
          <div className="space-y-2">
            {records?.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{r.category ?? r.scope} {r.emissionValue ?? 'N/A'} {r.unit}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{r.scope} · {r.reportingPeriod ?? 'N/A'}</p>
                </div>
                <span className={`font-semibold ${r.renewableEnergy ? 'text-green-500' : 'text-yellow-500'}`}>{r.renewableEnergy ? 'Renewable' : 'Non-Renewable'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}