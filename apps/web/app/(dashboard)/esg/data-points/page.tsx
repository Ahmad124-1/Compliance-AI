'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Check } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';

export default function EsgDataPointsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  const dataPointsQuery = useQuery({
    queryKey: ['esg', 'data-points', { search, isVerified: verifiedFilter }],
    queryFn: () => esgService.listDataPoints({ search: search || undefined, isVerified: verifiedFilter === 'true' ? true : verifiedFilter === 'false' ? false : undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteDataPoint(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'data-points'] }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => esgService.verifyDataPoint(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'data-points'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Data Points</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage ESG data collection and verification.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/data-points/new"><PlusCircle className="mr-2 h-4 w-4" />Add Data Point</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search data points..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Verification Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {dataPointsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : dataPointsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load data points.</div>
        ) : dataPointsQuery.data?.dataPoints.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No data points yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Metric ID</th>
                <th className="px-4 py-3 font-medium">Period ID</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataPointsQuery.data?.dataPoints.map((dp: any) => (
                <tr key={dp.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium text-xs">{dp.metricId}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{dp.periodId}</td>
                  <td className="px-4 py-3">{dp.value}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{dp.unit ?? '-'}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{dp.confidenceScore ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${dp.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {dp.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!dp.isVerified && (
                        <Button variant="ghost" size="sm" onClick={() => verifyMutation.mutate(dp.id)}><Check className="h-3 w-3" /></Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/data-points/${dp.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(dp.id)}><Trash2 className="h-3 w-3" /></Button>
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
