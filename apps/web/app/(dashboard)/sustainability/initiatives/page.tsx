'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2, Rocket, Calendar, DollarSign, Tag } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { INITIATIVE_STATUSES } from '@/modules/sustainability/constants.js';

export default function SustainabilityInitiativesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const initiativesQuery = useQuery({
    queryKey: ['sustainability', 'initiatives', { search, status: statusFilter }],
    queryFn: () => sustainabilityService.listInitiatives({ search: search || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sustainabilityService.deleteInitiative(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'initiatives'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Initiatives</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track sustainability initiatives and their milestones.</p>
        </div>
        <Button asChild>
          <Link href="/sustainability/initiatives/new">
            <PlusCircle className="mr-2 h-4 w-4" />New Initiative
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search initiatives..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Statuses</option>
            {INITIATIVE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {initiativesQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : initiativesQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load initiatives.</div>
        ) : initiativesQuery.data?.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No initiatives found. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Milestones</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initiativesQuery.data?.map((init: any) => (
                <tr key={init.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3">
                    <Link href={`/sustainability/initiatives/${init.id}`} className="font-medium hover:underline">
                      {init.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${init.status === 'completed' ? 'bg-green-100 text-green-800' : init.status === 'active' ? 'bg-blue-100 text-blue-800' : init.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {init.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{init.milestonesCount}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{init.dueDate ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sustainability/initiatives/${init.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(init.id)}><Trash2 className="h-3 w-3" /></Button>
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
