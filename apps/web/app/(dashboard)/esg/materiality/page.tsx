'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Check } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { PILLARS, FINANCIAL_IMPACTS } from '@/modules/esg/constants.js';

export default function EsgMaterialityPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');
  const [impactFilter, setImpactFilter] = useState('');

  const topicsQuery = useQuery({
    queryKey: ['esg', 'materiality', 'topics', { search, pillar: pillarFilter, financialImpact: impactFilter }],
    queryFn: () => esgService.listMaterialityTopics({ search: search || undefined, pillar: pillarFilter || undefined, financialImpact: impactFilter || undefined }),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteMaterialityTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'materiality', 'topics'] }),
  });

  const approveAssessmentMutation = useMutation({
    mutationFn: (id: string) => esgService.updateMaterialityAssessment(id, { approved: true, approvedBy: 'current-user', approvedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'materiality', 'assessments'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Materiality Assessment</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Assess ESG topics for financial and impact materiality.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/materiality/new"><PlusCircle className="mr-2 h-4 w-4" />New Topic</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search topics..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Pillars</option>
            {PILLARS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Financial Impact</option>
            {FINANCIAL_IMPACTS.map((fi) => (
              <option key={fi.value} value={fi.value}>{fi.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {topicsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : topicsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load materiality topics.</div>
        ) : topicsQuery.data?.topics.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No materiality topics yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Pillar</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Financial Impact</th>
                <th className="px-4 py-3 font-medium">Impact Score</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topicsQuery.data?.topics.map((t: any) => (
                <tr key={t.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))] capitalize">{t.pillar}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{t.category}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{t.financialImpact ?? '-'}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{t.impactScore ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/materiality/${t.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTopicMutation.mutate(t.id)}><Trash2 className="h-3 w-3" /></Button>
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
