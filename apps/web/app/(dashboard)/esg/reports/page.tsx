'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Download } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { REPORT_TYPES, REPORT_FORMATS, REPORT_STATUSES } from '@/modules/esg/constants.js';

export default function EsgReportsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const reportsQuery = useQuery({
    queryKey: ['esg', 'reports', { search, reportType: typeFilter, status: statusFilter }],
    queryFn: () => esgService.listReports({ search: search || undefined, reportType: typeFilter || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'reports'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ESG Reports</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Generate and manage ESG reports.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/reports/new"><PlusCircle className="mr-2 h-4 w-4" />Generate Report</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Types</option>
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
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
        ) : reportsQuery.data?.reports.length === 0 ? (
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
              {reportsQuery.data?.reports.map((r: any) => (
                <tr key={r.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{r.reportType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{r.format.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'published' ? 'bg-green-100 text-green-800' : r.status === 'completed' ? 'bg-blue-100 text-blue-800' : r.status === 'approved' ? 'bg-blue-100 text-blue-800' : r.status === 'generating' ? 'bg-yellow-100 text-yellow-800' : r.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/reports/${r.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      {r.fileUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={r.fileUrl} download><Download className="h-3 w-3" /></a>
                        </Button>
                      )}
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
