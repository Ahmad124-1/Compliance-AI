'use client';

import { useMemo } from 'react';
import { Building2, ShieldCheck, TrendingUp, AlertTriangle, MapPin, Package, Star, Clock } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { BarChart, DonutChart, StatTile } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { useQuery } from '@tanstack/react-query';
import { supplierService } from '@/modules/suppliers/service.js';
import { supplierEsgService } from '@/modules/supplier-esg/service.js';
import { supplierRiskService } from '@/modules/supplier-risk/service.js';
import { supplierScorecardService } from '@/modules/supplier-scorecards/service.js';
import { certificationService } from '@/modules/certifications/service.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export default function SuppliersPage() {
  const { session } = useAuth();

  const { data: suppliers, isLoading: sLoading, isError: sError, refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers', session?.organization.id],
    queryFn: () => supplierService.listSuppliers({ limit: '100' }).then((r) => r.suppliers ?? r),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['supplier-stats', session?.organization.id],
    queryFn: () => supplierService.getSupplierStats(),
  });

  const { data: esgSummary, isLoading: esgLoading } = useQuery({
    queryKey: ['supplier-esg-summary', session?.organization.id],
    queryFn: () => {
      if (!suppliers?.length) return null;
      return Promise.all(suppliers.slice(0, 5).map((s) => supplierEsgService.getAssessmentSummary(s.id)));
    },
  });

  const { data: riskHeatmap, isLoading: riskLoading } = useQuery({
    queryKey: ['supplier-risk-heatmap', session?.organization.id],
    queryFn: () => supplierRiskService.getRiskHeatmap(),
  });

  const { data: scorecards, isLoading: scLoading } = useQuery({
    queryKey: ['supplier-scorecards', session?.organization.id],
    queryFn: () => supplierScorecardService.listScorecards({ limit: '10' }).then((r) => r.scorecards ?? r),
  });

  const { data: certifications, isLoading: certLoading } = useQuery({
    queryKey: ['supplier-certifications', session?.organization.id],
    queryFn: () => certificationService.listCertifications({ limit: '10' }).then((r) => r.certifications ?? r),
  });

  const loading = sLoading || statsLoading || esgLoading || riskLoading || scLoading || certLoading;
  const isError = sError;

  if (isError) return <EmptyState title="Failed to load supplier data" message="Could not reach the supplier API." onRetry={() => refetchSuppliers()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Building2 className="h-6 w-6 text-[rgb(var(--primary))]" />
          Supplier Dashboard
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">Comprehensive supplier ESG performance, risk, audits, and compliance overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total Suppliers" value={stats?.total ?? suppliers?.length ?? 0} />
          <StatTile label="High Risk" value={stats?.highRisk ?? 0} />
          <StatTile label="Avg ESG Score" value={`${stats?.avgEsgScore ?? 0}%`} />
          <StatTile label="Avg Carbon Score" value={`${stats?.avgCarbonScore ?? 0}%`} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Supplier Ranking</h2>
          {loading ? <Skeleton className="h-48" /> : scorecards?.length ? (
            <div className="space-y-2">
              {scorecards.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                  <span className="font-medium">#{i + 1} {s.supplierName ?? 'Unknown'}</span>
                  <span className="font-semibold">{s.overallEsgScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No scorecard data" description="Scorecards will appear as assessments are completed." />
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Risk Overview</h2>
          {loading ? <Skeleton className="h-48" /> : riskHeatmap?.highRisks?.length ? (
            <div className="space-y-2">
              {riskHeatmap.highRisks.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                  <span className="font-medium">{r.title}</span>
                  <span className="font-semibold text-red-500">{r.riskScore}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No high risks" description="No high-risk suppliers detected." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-[rgb(var(--primary))]" />
            Certifications Status
          </h2>
          {loading ? <Skeleton className="h-48" /> : certifications?.length ? (
            <div className="space-y-2">
              {certifications.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                  <span className="font-medium">{c.certificationName}</span>
                  <span className={`font-semibold ${c.status === 'active' ? 'text-green-500' : c.status === 'expired' ? 'text-red-500' : 'text-yellow-500'}`}>{c.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No certifications" description="Certifications will appear as they are registered." />
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-[rgb(var(--primary))]" />
            ESG Assessment Summary
          </h2>
          {loading ? <Skeleton className="h-48" /> : esgSummary?.length ? (
            <div className="space-y-2">
              {esgSummary.filter(Boolean).map((summary) => (
                <div key={summary.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
                  <span className="font-medium">{summary.supplierName}</span>
                  <span className="font-semibold">{summary.avgOverallScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No assessments yet" description="ESG assessments will appear here." />
          )}
        </Card>
      </div>
    </div>
  );
}