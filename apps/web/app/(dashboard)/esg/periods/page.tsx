'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PERIOD_STATUSES, PERIOD_TYPES } from '@/modules/esg/constants.js';

export default function EsgPeriodsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const periodsQuery = useQuery({
    queryKey: ['esg', 'periods', { search, status: statusFilter, periodType: typeFilter }],
    queryFn: () => esgService.listPeriods({ search: search || undefined, status: statusFilter || undefined, periodType: typeFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deletePeriod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'periods'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reporting Periods</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage ESG reporting periods and cycles.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/periods/new"><PlusCircle className="mr-2 h-4 w-4" />New Period</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search periods..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            {PERIOD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Types</option>
            {PERIOD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {periodsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : periodsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load periods.</div>
        ) : periodsQuery.data?.periods.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No periods yet. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
                <th className="px-4 py-3 font-medium">End Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {periodsQuery.data?.periods.map((p: any) => (
                <tr key={p.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))] capitalize">{p.periodType}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{p.startDate}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{p.endDate}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{p.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'open' ? 'bg-green-100 text-green-800' : p.status === 'closed' ? 'bg-gray-100 text-gray-800' : p.status === 'finalized' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/periods/${p.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
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
