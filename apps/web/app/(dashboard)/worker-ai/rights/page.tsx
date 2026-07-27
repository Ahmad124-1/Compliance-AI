'use client';

import { useMemo, useState } from 'react';
import { Shield } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { useRightsTopics } from '@/modules/worker-ai/store.js';
import { RIGHTS_CATEGORY_LABELS } from '@/modules/worker-ai/constants.js';
import { LANGUAGE_OPTIONS } from '@/modules/worker-ai/constants.js';

export default function WorkerAiRightsPage() {
  const { data: topics, isLoading } = useRightsTopics('en');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    if (!topics) return [];
    return topics.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && t.category !== category) return false;
      return true;
    });
  }, [topics, search, category]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Rights Explainer</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Understand worker rights, human rights, health and safety, leave, benefits, contracts, and factory policies.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs text-[rgb(var(--muted))]">Search topics</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g., overtime, maternity leave" />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-48"
          >
            <option value="">All categories</option>
            {Object.entries(RIGHTS_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value="en"
            disabled
            className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-36"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && (
          <>
            <Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" />
          </>
        )}
        {(filtered ?? []).map((topic) => (
          <Card key={topic.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-[rgb(var(--primary)/0.1)] p-2 text-[rgb(var(--primary))]">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{topic.title}</h3>
                <span className="text-xs text-[rgb(var(--muted))]">{RIGHTS_CATEGORY_LABELS[topic.category] ?? topic.category}</span>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{topic.description}</p>
                <button className="mt-3 text-sm font-medium text-[rgb(var(--primary))] hover:underline">
                  Learn more
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <Shield className="mx-auto h-8 w-8 text-[rgb(var(--muted-2))]" />
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">No topics match your search.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
