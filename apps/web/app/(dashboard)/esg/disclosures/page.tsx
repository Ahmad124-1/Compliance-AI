'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Send, Check, X, Eye } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PILLARS, DISCLOSURE_STATUSES } from '@/modules/esg/constants.js';

export default function EsgDisclosuresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const disclosuresQuery = useQuery({
    queryKey: ['esg', 'disclosures', { search, pillar: pillarFilter, status: statusFilter }],
    queryFn: () => esgService.listDisclosures({ search: search || undefined, pillar: pillarFilter || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteDisclosure(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => esgService.updateDisclosure(id, { status: 'in_review', submittedBy: 'current-user', submittedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => esgService.updateDisclosure(id, { status: 'approved', approvedBy: 'current-user', approvedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => esgService.updateDisclosure(id, { status: 'published', publishedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'disclosures'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Disclosures</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create, review, approve, and publish ESG disclosures.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/disclosures/new"><PlusCircle className="mr-2 h-4 w-4" />New Disclosure</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search disclosures..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Pillars</option>
            {PILLARS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            {DISCLOSURE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {disclosuresQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : disclosuresQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load disclosures.</div>
        ) : disclosuresQuery.data?.disclosures.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No disclosures yet. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Pillar</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assurance</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disclosuresQuery.data?.disclosures.map((d: any) => (
                <tr key={d.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))] capitalize">{d.pillar}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${d.status === 'published' ? 'bg-green-100 text-green-800' : d.status === 'approved' ? 'bg-blue-100 text-blue-800' : d.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' : d.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${d.assuranceStatus === 'completed' ? 'bg-green-100 text-green-800' : d.assuranceStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {d.assuranceStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/disclosures/${d.id}`}><Eye className="h-3 w-3" /></Link>
                      </Button>
                      {d.status === 'draft' && (
                        <Button variant="ghost" size="sm" onClick={() => submitMutation.mutate(d.id)}><Send className="h-3 w-3" /></Button>
                      )}
                      {d.status === 'in_review' && (
                        <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(d.id)}><Check className="h-3 w-3" /></Button>
                      )}
                      {d.status === 'approved' && (
                        <Button variant="ghost" size="sm" onClick={() => publishMutation.mutate(d.id)}><Eye className="h-3 w-3" /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(d.id)}><X className="h-3 w-3" /></Button>
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
