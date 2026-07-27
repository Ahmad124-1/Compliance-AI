'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card } from '@/components/ui/card.js';
import { predictiveApi } from '@/modules/predictive/api.js';

export default function RecommendationsPage() {
  const [filters, setFilters] = useState<{ status?: string; priority?: string; type?: string }>({});
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', filters],
    queryFn: () => predictiveApi.recommendations(filters),
  });
  const qc = useQueryClient();
  const generateMutation = useMutation({
    mutationFn: () => predictiveApi.generateRecommendations({ type: 'general', context: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => predictiveApi.updateRecommendation(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  const items = (data ?? []) as any[];

  function priorityColor(p: string) {
    if (p === 'urgent') return 'bg-red-100 text-red-700';
    if (p === 'high') return 'bg-orange-100 text-orange-700';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Recommendations</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Actionable recommendations to improve compliance performance.</p>
        </div>
        <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="rounded-md bg-[rgb(var(--primary))] px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Generate Recommendations</button>
      </div>

      <section className="flex gap-2">
        <select value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))} className="rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1 text-xs">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={filters.priority ?? ''} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined }))} className="rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1 text-xs">
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </section>

      {isLoading ? (
        <Card className="p-4"><p className="text-xs text-[rgb(var(--muted))]">Loading recommendations…</p></Card>
      ) : (
        <section className="grid gap-3">
          {items.length === 0 ? (
            <Card className="p-4"><p className="text-xs text-[rgb(var(--muted))]">No recommendations found.</p></Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(item.priority)}`}>{item.priority}</span>
                      <span className="text-xs text-[rgb(var(--muted))]">{item.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{item.description}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]"><span className="font-medium">Impact:</span> {item.expectedImpact}</p>
                    <p className="text-xs text-[rgb(var(--muted))]"><span className="font-medium">Reason:</span> {item.reason}</p>
                    <p className="text-xs text-[rgb(var(--muted))]"><span className="font-medium">Effort:</span> {item.estimatedEffort}</p>
                  </div>
                  {item.status === 'open' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateMutation.mutate({ id: item.id, status: 'actioned' })} className="rounded-md border border-[rgb(var(--border-color))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel-2))]">Mark Actioned</button>
                      <button onClick={() => updateMutation.mutate({ id: item.id, status: 'dismissed' })} className="rounded-md border border-[rgb(var(--border-color))] px-2 py-1 text-xs hover:bg-[rgb(var(--panel-2))]">Dismiss</button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </section>
      )}
    </div>
  );
}
