'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { certificationService } from '@/modules/certifications/service.js';

export default function CertificationsPage() {
  const { session } = useAuth();

  const { data: certifications, isLoading: cLoading, refetch: refetchCerts } = useQuery({
    queryKey: ['supplier-certifications', session?.organization.id],
    queryFn: () => certificationService.listCertifications({ limit: '100' }).then((r) => r.certifications ?? r),
  });

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of certifications ?? []) {
      map.set(c.certificationType, (map.get(c.certificationType) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [certifications]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of certifications ?? []) {
      map.set(c.status, (map.get(c.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [certifications]);

  const loading = cLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Award className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Certifications
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Track certification status, expiry dates, renewals, and verifications.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Certs" value={certifications?.length ?? 0} />
          <StatTile label="Active" value={certifications?.filter((c) => c.status === 'active').length ?? 0} />
          <StatTile label="Expired" value={certifications?.filter((c) => c.status === 'expired').length ?? 0} />
          <StatTile label="Pending Renewal" value={certifications?.filter((c) => c.status === 'pending_renewal').length ?? 0} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">By Type</h2>
          {loading ? <Skeleton className="h-48" /> : byType.length ? <BarChart data={byType} /> : <EmptyState title="No type data" />}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">By Status</h2>
          {loading ? <Skeleton className="h-48" /> : byStatus.length ? <BarChart data={byStatus} /> : <EmptyState title="No status data" />}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Certifications</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : certifications?.length === 0 ? (
          <EmptyState title="No certifications" description="Add certifications to track supplier compliance." />
        ) : (
          <div className="space-y-2">
            {certifications?.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{c.certificationName}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{c.certificationType} · {c.certificationBody ?? 'N/A'}</p>
                </div>
                <span className={`font-semibold ${c.status === 'active' ? 'text-green-500' : c.status === 'expired' ? 'text-red-500' : 'text-yellow-500'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}