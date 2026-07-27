'use client';

import { useState } from 'react';
import { BookOpen, Search, UploadCloud, Database } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Field } from '@/components/ui/Field.js';
import { useKnowledgeStandards, useIngestDocument, useVectorSearch, useIndexKnowledgeBase } from '@/modules/ai/hooks.js';
import { KNOWLEDGE_DOMAINS } from '@/modules/ai/constants.js';

export function KnowledgeBasePanel() {
  const { data: standards, isLoading } = useKnowledgeStandards();
  const ingest = useIngestDocument();
  const indexKb = useIndexKnowledgeBase();
  const search = useVectorSearch();

  const [query, setQuery] = useState('');
  const [doc, setDoc] = useState({ domain: 'policy', title: '', content: '' });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold">Compliance Knowledge Base</h2>
        </div>
        {isLoading ? (
          <p className="text-xs text-[rgb(var(--muted))]">Loading standards…</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto text-xs">
            {(standards ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded border border-[rgb(var(--border-color))] px-2 py-1.5">
                <span className="font-medium text-[rgb(var(--text))]">{s.name}</span>
                <span className="text-[rgb(var(--muted))]">{s.code}</span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="subtle" onClick={() => indexKb.mutate()} disabled={indexKb.isPending}>
          <UploadCloud className="h-4 w-4" /> {indexKb.isPending ? 'Indexing…' : 'Index knowledge base (embeddings)'}
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold">Ingest Document</h2>
        </div>
        <Field label="Domain">
          <select className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm" value={doc.domain} onChange={(e) => setDoc((d) => ({ ...d, domain: e.target.value }))}>
            {KNOWLEDGE_DOMAINS.map((d) => (<option key={d.code} value={d.code}>{d.label}</option>))}
          </select>
        </Field>
        <Field label="Title">
          <Input value={doc.title} onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))} placeholder="e.g. Local Labour Law — Bangladesh" />
        </Field>
        <Field label="Content">
          <Textarea rows={6} value={doc.content} onChange={(e) => setDoc((d) => ({ ...d, content: e.target.value }))} placeholder="Paste policy, audit, CAPA or supplier text to embed…" />
        </Field>
        <label className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
          <input type="checkbox" checked onChange={(e) => setDoc((d) => ({ ...d, index: e.target.checked }))} /> Index immediately after ingest
        </label>
        <Button onClick={() => ingest.mutateAsync(doc as any)} disabled={ingest.isPending || !doc.title || !doc.content}>
          {ingest.isPending ? 'Ingesting…' : 'Ingest'}
        </Button>
        {ingest.data && <p className="text-xs text-emerald-500">Created {ingest.data.entries} chunk(s).</p>}
      </Card>

      <Card className="space-y-3 p-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold">Semantic Vector Search</h2>
        </div>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search policies, clauses, CAPAs, suppliers…" onKeyDown={(e) => e.key === 'Enter' && query && search.mutate({ query })} />
          <Button onClick={() => query && search.mutate({ query })} disabled={search.isPending || !query}>Search</Button>
        </div>
        <ul className="space-y-2">
          {(search.data ?? []).map((h) => (
            <li key={h.id} className="rounded border border-[rgb(var(--border-color))] p-2 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[rgb(var(--muted))]">{h.domain}</span>
                <span className="text-[rgb(var(--muted))]">score {h.score.toFixed(3)}</span>
              </div>
              <p className="whitespace-pre-wrap text-[rgb(var(--text))]">{h.content}</p>
            </li>
          ))}
          {search.data && search.data.length === 0 && <li className="text-xs text-[rgb(var(--muted))]">No matches. Ensure the knowledge base is indexed.</li>}
        </ul>
      </Card>
    </div>
  );
}
