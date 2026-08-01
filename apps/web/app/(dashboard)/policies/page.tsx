'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Plus, Search, Check, X, Eye, FileText, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/states.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { policiesService } from '@/modules/policies/service.js';
import { POLICY_TYPES } from '@/modules/policies/constants.js';
import type { PolicyRecord } from '@/modules/policies/types.js';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function PoliciesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<PolicyRecord | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState<string>(POLICY_TYPES[0].value);
  const [genContext, setGenContext] = useState('');

  const policiesQuery = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesService.listPolicies(),
  });

  const filtered = useMemo(() => {
    const list = policiesQuery.data ?? [];
    let rows = list;
    if (statusFilter) rows = rows.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          (p.content ?? '').toLowerCase().includes(q),
      );
    }
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [policiesQuery.data, search, statusFilter]);

  const generateMutation = useMutation({
    mutationFn: () =>
      policiesService.generatePolicy(genType, genContext.trim() ? { description: genContext.trim() } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setShowGenerate(false);
      setGenType(POLICY_TYPES[0].value);
      setGenContext('');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => policiesService.approvePolicy(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      if (selected?.id === updated.id) setSelected(updated);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => policiesService.rejectPolicy(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      if (selected?.id === updated.id) setSelected(updated);
    },
  });

  if (policiesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load policies"
        message="Could not reach the policy API."
        onRetry={() => policiesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Policies</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Manage, version, and approve compliance policies.
          </p>
        </div>
        <Button onClick={() => setShowGenerate(true)}>
          <Plus className="h-4 w-4" /> Generate Policy
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input
            placeholder="Search policies…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Card className="p-6">
        {policiesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search || statusFilter ? (
            <NoResults query={search} />
          ) : (
            <EmptyState
              icon={<ShieldCheck className="h-10 w-10" />}
              title="No policies yet"
              description="Generate your first policy with the AI assistant or create one manually."
              action={<Button onClick={() => setShowGenerate(true)}>Generate Policy</Button>}
            />
          )
        ) : (
          <ul className="divide-y divide-[rgb(var(--border-color))]">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setSelected(p)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--panel-2))]">
                    <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {p.type} · v{p.version} · {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {p.status}
                  </span>
                  {p.status === 'draft' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(p.id)} title="Approve">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => rejectMutation.mutate(p.id)} title="Reject">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setSelected(p)} title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Card className="max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {selected.type} · Version {selected.version} · Status {selected.status}
                  {selected.approvedAt ? ` · Approved ${new Date(selected.approvedAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4 text-sm text-[rgb(var(--text))]">
              {selected.content}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => policiesService.exportPolicy(selected.id, 'markdown').then((r) => {
                  const blob = new Blob([r.content], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selected.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                })}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
              {selected.status === 'draft' && (
                <>
                  <Button variant="success" size="sm" onClick={() => approveMutation.mutate(selected.id)}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate(selected.id)}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generate Policy</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowGenerate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="policy-type">Policy Type</label>
                <select
                  id="policy-type"
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm"
                >
                  {POLICY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="policy-context">
                  Context <span className="text-[rgb(var(--muted))]">(optional)</span>
                </label>
                <Textarea
                  id="policy-context"
                  placeholder="Describe your organization, commitments, or specific requirements…"
                  value={genContext}
                  onChange={(e) => setGenContext(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

