'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Target, TrendingUp, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { ESG_PILLARS, GOAL_STATUSES } from '@/modules/sustainability/constants.js';

export default function SustainabilityGoalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const goalsQuery = useQuery({
    queryKey: ['sustainability', 'goals', { search, esgPillar: pillarFilter, status: statusFilter }],
    queryFn: () => sustainabilityService.listGoals({ search: search || undefined, esgPillar: pillarFilter || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sustainabilityService.deleteGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'goals'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ESG Goals</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track measurable environmental, social, and governance goals.</p>
        </div>
        <Button asChild>
          <Link href="/sustainability/goals/new">
            <PlusCircle className="mr-2 h-4 w-4" />New Goal
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search goals..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)}>
            <option value="">All Pillars</option>
            {ESG_PILLARS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {GOAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {goalsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : goalsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load goals.</div>
        ) : goalsQuery.data?.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No goals found. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Goal</th>
                <th className="px-4 py-3 font-medium">Pillar</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {goalsQuery.data?.map((g: any) => (
                <tr key={g.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3">
                    <Link href={`/sustainability/goals/${g.id}`} className="font-medium hover:underline">
                      {g.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{g.esgPillar}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[rgb(var(--muted))]">
                        <div className="h-1.5 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${g.progressPct ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-[rgb(var(--muted))]">{g.progressPct ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${g.status === 'achieved' ? 'bg-green-100 text-green-800' : g.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : g.status === 'at_risk' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sustainability/goals/${g.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(g.id)}><Trash2 className="h-3 w-3" /></Button>
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

function Select({ value, onChange, children }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={onChange} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
      {children}
    </select>
  );
}
