'use client';

import { useState } from 'react';
import { BookOpen, Search, FileText, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useKnowledgeStandards, useVectorSearch } from '@/modules/ai/hooks.js';

const TABS = [
  { key: 'standards', label: 'Standards', icon: ShieldCheck },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'policies', label: 'Policies', icon: BookOpen },
  { key: 'audits', label: 'Audit History', icon: ShieldCheck },
] as const;

export default function KnowledgeBasePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('standards');
  const [query, setQuery] = useState('');
  const { data: standards, isLoading } = useKnowledgeStandards();
  const vectorSearch = useVectorSearch();

  const handleSearch = () => {
    if (query.trim()) {
      vectorSearch.mutate({ query: query.trim(), limit: 10 });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Search standards, documents, policies and audit history</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[rgb(var(--border-color))]">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${
                tab === t.key
                  ? 'border-[rgb(var(--primary))] font-medium text-[rgb(var(--text))]'
                  : 'border-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'standards' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search compliance standards…"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || vectorSearch.isPending}>Search</Button>
          </div>
          {isLoading ? (
            <p className="text-xs text-[rgb(var(--muted))]">Loading standards…</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {(standards ?? []).map((s) => (
                <div key={s.id} className="rounded border border-[rgb(var(--border-color))] p-3">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{s.code} · {s.publisher ?? '—'} · {s.category}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
                className="flex-1"
              />
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || vectorSearch.isPending}>Search</Button>
          </div>
          <div className="space-y-2">
            {vectorSearch.data?.map((h) => (
              <div key={h.id} className="rounded border border-[rgb(var(--border-color))] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[rgb(var(--muted))]">{h.domain}</span>
                  <span className="text-[rgb(var(--muted))]">score {h.score.toFixed(3)}</span>
                </div>
                <p className="mt-1 text-[rgb(var(--text))]">{h.content}</p>
              </div>
            ))}
            {vectorSearch.data && vectorSearch.data.length === 0 && (
              <p className="text-xs text-[rgb(var(--muted))]">No matches found.</p>
            )}
          </div>
        </Card>
      )}

      {tab === 'policies' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search policies…"
                className="flex-1"
              />
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || vectorSearch.isPending}>Search</Button>
          </div>
          <div className="space-y-2">
            {vectorSearch.data?.map((h) => (
              <div key={h.id} className="rounded border border-[rgb(var(--border-color))] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[rgb(var(--muted))]">{h.domain}</span>
                  <span className="text-[rgb(var(--muted))]">score {h.score.toFixed(3)}</span>
                </div>
                <p className="mt-1 text-[rgb(var(--text))]">{h.content}</p>
              </div>
            ))}
            {vectorSearch.data && vectorSearch.data.length === 0 && (
              <p className="text-xs text-[rgb(var(--muted))]">No matches found.</p>
            )}
          </div>
        </Card>
      )}

      {tab === 'audits' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search audit history…"
                className="flex-1"
              />
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || vectorSearch.isPending}>Search</Button>
          </div>
          <div className="space-y-2">
            {vectorSearch.data?.map((h) => (
              <div key={h.id} className="rounded border border-[rgb(var(--border-color))] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[rgb(var(--muted))]">{h.domain}</span>
                  <span className="text-[rgb(var(--muted))]">score {h.score.toFixed(3)}</span>
                </div>
                <p className="mt-1 text-[rgb(var(--text))]">{h.content}</p>
              </div>
            ))}
            {vectorSearch.data && vectorSearch.data.length === 0 && (
              <p className="text-xs text-[rgb(var(--muted))]">No matches found.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
