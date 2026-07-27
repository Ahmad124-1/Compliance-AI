'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { ASSURANCE_TYPES, ASSURANCE_STATUSES } from '@/modules/esg/constants.js';

export default function EsgAssurancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const assuranceQuery = useQuery({
    queryKey: ['esg', 'assurance', { search, assuranceType: typeFilter, status: statusFilter }],
    queryFn: () => esgService.listAssurance({ search: search || undefined, assuranceType: typeFilter || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteAssurance(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'assurance'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assurance</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage ESG assurance engagements and findings.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/assurance/new"><PlusCircle className="mr-2 h-4 w-4" />New Assurance</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search assurance records..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Types</option>
            {ASSURANCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            {ASSURANCE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {assuranceQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : assuranceQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load assurance records.</div>
        ) : assuranceQuery.data?.assurances.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No assurance records yet. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assuranceQuery.data?.assurances.map((a: any) => (
                <tr key={a.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{a.assuranceType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{a.scopeDescription?.slice(0, 60)}{a.scopeDescription?.length > 60 ? '...' : ''}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{a.providerName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'completed' ? 'bg-green-100 text-green-800' : a.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : a.status === 'planned' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/assurance/${a.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-3 w-3" /></Button>
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
