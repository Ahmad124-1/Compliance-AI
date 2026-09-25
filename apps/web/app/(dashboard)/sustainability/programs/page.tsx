'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, FolderOpen, Pause, Play, Archive } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { PROGRAM_CATEGORIES, PROGRAM_STATUSES } from '@/modules/sustainability/constants.js';

export default function SustainabilityProgramsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const programsQuery = useQuery({
    queryKey: ['sustainability', 'programs', { search, status: statusFilter, category: categoryFilter }],
    queryFn: () => sustainabilityService.listPrograms({ search: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sustainabilityService.deleteProgram(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sustainabilityService.updateProgram(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Programs</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage sustainability programs and their lifecycle.</p>
        </div>
        <Button asChild>
          <Link href="/sustainability/programs/new">
            <PlusCircle className="mr-2 h-4 w-4" />New Program
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            {PROGRAM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Categories</option>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {programsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : programsQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load programs.</div>
        ) : programsQuery.data?.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No programs found. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programsQuery.data?.map((p: any) => (
                <tr key={p.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3">
                    <Link href={`/sustainability/programs/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100 text-green-800' : p.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {p.status === 'active' ? <Play className="h-3 w-3" /> : p.status === 'paused' ? <Pause className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{p.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sustainability/programs/${p.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => statusMutation.mutate({ id: p.id, status: p.status === 'active' ? 'paused' : 'active' })}>
                        {p.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
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
