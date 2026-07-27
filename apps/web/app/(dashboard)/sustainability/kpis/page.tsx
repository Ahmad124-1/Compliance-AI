'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Activity } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { KPI_TYPES, KPI_FREQUENCIES } from '@/modules/sustainability/constants.js';

export default function SustainabilityKpisPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [freqFilter, setFreqFilter] = useState('');

  const kpisQuery = useQuery({
    queryKey: ['sustainability', 'kpis', { search, kpiType: typeFilter, frequency: freqFilter }],
    queryFn: () => sustainabilityService.listKpis({ search: search || undefined, kpiType: typeFilter || undefined, frequency: freqFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sustainabilityService.deleteKpi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'kpis'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KPIs</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define and track key performance indicators for sustainability.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sustainability/kpis/new">
            <PlusCircle className="mr-2 h-4 w-4" />New KPI
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search KPIs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Types</option>
            {KPI_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={freqFilter} onChange={(e) => setFreqFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Frequencies</option>
            {KPI_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {kpisQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : kpisQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load KPIs.</div>
        ) : kpisQuery.data?.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No KPIs found. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kpisQuery.data?.map((k: any) => (
                <tr key={k.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{k.kpiType}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{k.frequency}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{k.targetValue !== null && k.targetValue !== undefined ? `${k.targetValue} ${k.unit}` : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/sustainability/kpis/${k.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(k.id)}><Trash2 className="h-3 w-3" /></Button>
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
