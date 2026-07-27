'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, FileDown } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { REPORT_TYPES_SUSTAINABILITY } from '@/modules/sustainability/constants.js';

export default function SustainabilityReportsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const reportsQuery = useQuery({
    queryKey: ['sustainability', 'reports', { search, reportType: typeFilter, status: statusFilter }],
    queryFn: () => sustainabilityService.listReports({ search: search || undefined, reportType: typeFilter || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sustainabilityService.deleteReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'reports'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Generate and manage sustainability reports.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sustainability/reports/new">
            <PlusCircle className="mr-2 h-4 w-4" />Generate Report
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Types</option>
            {REPORT_TYPES_SUSTAINABILITY.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {reportsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : reportsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load reports.</div>
        ) : reportsQuery.data?.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No reports yet. Generate one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Format</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportsQuery.data?.map((r: any) => (
                <tr key={r.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{r.reportType}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{r.format}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'generated' ? 'bg-green-100 text-green-800' : r.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/sustainability/reports/${r.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
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
