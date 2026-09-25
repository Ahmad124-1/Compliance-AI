'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { dataHubService } from '@/modules/data-hub/service.js';

const TABS = [
  { key: 'facilities', label: 'Facilities' },
  { key: 'sites', label: 'Sites' },
  { key: 'departments', label: 'Departments' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'programs', label: 'Programs' },
  { key: 'goals', label: 'Goals' },
  { key: 'kpis', label: 'KPIs' },
  { key: 'projects', label: 'Projects' },
  { key: 'reportingPeriods', label: 'Reporting Periods' },
  { key: 'emissionFactors', label: 'Emission Factors' },
  { key: 'users', label: 'Users' },
  { key: 'documents', label: 'Documents' },
  { key: 'units', label: 'Units' },
  { key: 'currencies', label: 'Currencies' },
  { key: 'countries', label: 'Countries' },
  { key: 'standards', label: 'Standards' },
  { key: 'frameworks', label: 'Frameworks' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function DataHubMasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('facilities');
  // Sprint 4.1: read from the centralized sync endpoint so every module
  // (Sustainability, Carbon, ESG, Environment) sees the exact same records.
  const masterQuery = useQuery({
    queryKey: ['data-hub', 'sync', 'master-data'],
    queryFn: () => dataHubService.syncMasterData(),
  });

  const data = masterQuery.data?.[activeTab];

  const renderValue = (v: unknown): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  const columns = data?.length
    ? Object.keys(data[0])
        .filter((k) => !['id', 'organization_id', 'created_at', 'updated_at'].includes(k))
        .slice(0, 8)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Master Data</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Reusable master data shared across Sustainability, Carbon & GHG, ESG, Compliance and Supplier modules. Records edited here update everywhere.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {masterQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : masterQuery.isError ? (
        <ErrorState title="Failed to load master data" onRetry={() => masterQuery.refetch()} />
      ) : (
        <Card className="overflow-hidden">
          {data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[rgb(var(--panel-2))] text-left">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-2 font-medium capitalize">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((row: Record<string, unknown>, idx: number) => (
                    <tr key={idx} className="border-t border-[rgb(var(--border-color))]">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-2">{renderValue(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-[rgb(var(--muted))]">
              No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} records yet. Add them via the module forms or import them through the Import Center — they will appear here and be reused across all modules.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}