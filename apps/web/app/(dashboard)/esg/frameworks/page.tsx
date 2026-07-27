'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esgService } from '@/modules/esg/service.js';
import { FRAMEWORK_CODES } from '@/modules/esg/constants.js';

export default function EsgFrameworksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState('');

  const frameworksQuery = useQuery({
    queryKey: ['esg', 'frameworks', { search, frameworkCode: codeFilter }],
    queryFn: () => esgService.listFrameworks({ search: search || undefined, frameworkCode: codeFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => esgService.deleteFramework(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esg', 'frameworks'] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ESG Frameworks</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Configure reporting standards like GRI, SASB, TCFD, CSRD.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/esg/frameworks/new"><PlusCircle className="mr-2 h-4 w-4" />Add Framework</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search frameworks..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
            <option value="">All Frameworks</option>
            {FRAMEWORK_CODES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {frameworksQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : frameworksQuery.isError ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">Failed to load frameworks.</div>
        ) : frameworksQuery.data?.frameworks.length === 0 ? (
          <div className="p-6 text-center text-sm text-[rgb(var(--muted))]">No frameworks yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[rgb(var(--border-color))]">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Issuing Body</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {frameworksQuery.data?.frameworks.map((f: any) => (
                <tr key={f.id} className="border-b border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{f.frameworkCode.toUpperCase()}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{f.version}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{f.issuingBody ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${f.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {f.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/esg/frameworks/${f.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(f.id)}><Trash2 className="h-3 w-3" /></Button>
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
