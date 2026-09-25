'use client';

import { useQuery } from '@tanstack/react-query';
import { Settings2, Cpu, BarChart3, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { dataHubService } from '@/modules/data-hub/service.js';

export default function DataHubSettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ['data-hub', 'settings'],
    queryFn: () => dataHubService.getSettings(),
  });

  const settings = settingsQuery.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Hub Settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Configure the shared sustainability workspace. These settings apply to master data, imports, validation, AI extraction extensions and report aggregation across all modules.
        </p>
      </div>

      {settingsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : settingsQuery.isError ? (
        <ErrorState title="Failed to load settings" onRetry={() => settingsQuery.refetch()} />
      ) : settings ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold">Entity Types</h2>
            </div>
            <p className="text-xs text-[rgb(var(--muted))]">Shared master data entities reusable across all modules:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {settings.entityTypes.map((t) => (
                <span key={t} className="rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-xs capitalize">{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold">AI Extraction (Future-Ready)</h2>
            </div>
            <p className="text-sm">
              Status: <span className={settings.aiExtraction.enabled ? 'text-green-600' : 'text-[rgb(var(--muted))]'}>{settings.aiExtraction.enabled ? 'Enabled' : 'Ready — not enabled'}</span>
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">OCR and LLM extraction are prepared as extension points. No extraction runs yet.</p>
            <div className="mt-3 space-y-2">
              {settings.aiExtraction.capabilities.map((cap) => (
                <div key={cap.name} className="rounded border border-[rgb(var(--border-color))] p-2 text-sm">
                  <span className="font-medium">{cap.name}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cap.supportedTypes.map((t) => (
                      <span key={t} className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-xs">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold">Validation Actions</h2>
            </div>
            <p className="text-xs text-[rgb(var(--muted))]">Actions available in the validation queue:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {settings.validationActions.map((a) => (
                <span key={a} className="rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-xs capitalize">{a}</span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold">Report Aggregation</h2>
            </div>
            <p className="text-xs text-[rgb(var(--muted))]">Reusable aggregation infrastructure for Compliance, Sustainability, Carbon & GHG, ESG, supplier, dashboards, analytics and reports.</p>
            <div className="mt-3 space-y-1 text-sm">
              {Object.entries(settings.reportAggregation).length ? (
                Object.entries(settings.reportAggregation).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] py-1">
                    <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="text-[rgb(var(--muted))]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[rgb(var(--muted))]">No aggregation configuration yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-5 md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[rgb(var(--primary))]" />
              <h2 className="text-sm font-semibold">Import Statuses</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.importStatuses.map((s) => (
                <span key={s} className="rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-xs capitalize">{s}</span>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}