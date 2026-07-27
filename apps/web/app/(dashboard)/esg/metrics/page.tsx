'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PILLARS, METRIC_DATA_TYPES, METRIC_FREQUENCIES } from '@/modules/esg/constants.js';

export default function EsgMetricsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');

  const metricsQuery = useQuery({
    queryKey: ['esg', 'metrics', { search, pillar: pillarFilter, reportingFrequency: frequencyFilter }],
    queryFn: () => esgService.listMetrics({ search: search || undefined, pillar: pillarFilter || undefined, reportingFrequency: frequencyFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteMetric(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'metrics'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ESG Metrics</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define and manage ESG reporting metrics.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/metrics/new"><PlusCircle className="mr-2 h-4 w-4" />Add Metric</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search metrics..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Pillars</option>
            {PILLARS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select value={frequencyFilter} onChange={(e) => setFrequencyFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Frequencies</option>
            {METRIC_FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {metricsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : metricsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load metrics.</div>
        ) : metricsQuery.data?.metrics.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No metrics yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Pillar</th>
                <th className="px-4 py-3 font-medium">Data Type</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {metricsQuery.data?.metrics.map((m: any) => (
                <tr key={m.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{m.metricCode}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))] capitalize">{m.pillar}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{m.dataType}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{m.reportingFrequency}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/metrics/${m.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
