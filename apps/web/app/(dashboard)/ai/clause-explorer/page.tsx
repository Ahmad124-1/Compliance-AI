'use client';

import { useState } from 'react';
import { Search, BookOpen, Lightbulb } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { useMutation } from '@tanstack/react-query';

const STANDARDS = [
  { id: 'sa8000', name: 'SA8000', full: 'Social Accountability 8000' },
  { id: 'smeta', name: 'SMETA', full: 'Sedex Members Ethical Trade Audit' },
  { id: 'sedex', name: 'SEDEX', full: 'Supplier Ethical Data Exchange' },
  { id: 'iso9001', name: 'ISO 9001', full: 'Quality Management Systems' },
  { id: 'iso14001', name: 'ISO 14001', full: 'Environmental Management Systems' },
  { id: 'iso45001', name: 'ISO 45001', full: 'Occupational Health & Safety' },
  { id: 'wrap', name: 'WRAP', full: 'Worldwide Responsible Accredited Production' },
  { id: 'bsci', name: 'BSCI', full: 'Business Social Compliance Initiative' },
  { id: 'slcp', name: 'SLCP', full: 'Social & Labour Convergence Program' },
  { id: 'higg-fem', name: 'Higg FEM', full: 'Facility Environmental Module' },
  { id: 'gots', name: 'GOTS', full: 'Global Organic Textile Standard' },
  { id: 'ilo', name: 'ILO Conventions', full: 'International Labour Organization' },
  { id: 'ungp', name: 'UNGP', full: 'UN Guiding Principles on Business and Human Rights' },
];

const SAMPLE_CLAUSES: Record<string, Array<{ id: string; title: string }>> = {
  sa8000: [
    { id: '1.1', title: 'Child Labour' },
    { id: '1.2', title: 'Forced Labour' },
    { id: '2.1', title: 'Health & Safety' },
    { id: '3.1', title: 'Freedom of Association' },
    { id: '4.1', title: 'Discrimination' },
    { id: '5.1', title: 'Working Hours' },
    { id: '6.1', title: 'Remuneration' },
  ],
  iso45001: [
    { id: '4.3', title: 'Determining scope' },
    { id: '5.2', title: 'Leadership & commitment' },
    { id: '6.1', title: 'Actions to address risks' },
    { id: '7.2', title: 'Competence' },
    { id: '8.1', title: 'Operational planning' },
    { id: '9.1', title: 'Monitoring & measurement' },
    { id: '10.2', title: 'Continual improvement' },
  ],
};

export default function ClauseExplorerPage() {
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [selectedClause, setSelectedClause] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const explainClause = useMutation({
    mutationFn: async ({ standardId, clauseId }: { standardId: string; clauseId: string }) => {
      const res = await fetch(`/api/v1/ai/clauses/${standardId}/${clauseId}/explain`);
      if (!res.ok) throw new Error('Failed to explain clause');
      return res.json();
    },
  });

  const clauses = selectedStandard ? (SAMPLE_CLAUSES[selectedStandard] ?? []) : [];
  const filteredStandards = STANDARDS.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.full.toLowerCase().includes(search.toLowerCase()),
  );

  const explanation = selectedClause && selectedStandard ? explainClause.data : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Clause Explorer</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Search and explore compliance clauses with AI explanations</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search standards…"
            className="max-w-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[rgb(var(--border-color))] px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted))]">Standards</p>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {filteredStandards.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStandard(s.id); setSelectedClause(null); }}
                className={`w-full border-b border-[rgb(var(--border-color))] px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedStandard === s.id ? 'bg-[rgb(var(--panel-2))]' : 'hover:bg-[rgb(var(--panel-2))]'
                }`}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{s.full}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[rgb(var(--border-color))] px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted))]">Clauses</p>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {selectedStandard ? (
              clauses.length > 0 ? (
                clauses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClause(c.id); explainClause.mutate({ standardId: selectedStandard, clauseId: c.id }); }}
                    className={`w-full border-b border-[rgb(var(--border-color))] px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedClause === c.id ? 'bg-[rgb(var(--panel-2))]' : 'hover:bg-[rgb(var(--panel-2))]'
                    }`}
                  >
                    <span className="font-mono text-xs text-[rgb(var(--muted))]">{c.id}</span>
                    <span className="ml-2">{c.title}</span>
                  </button>
                ))
              ) : (
                <p className="p-4 text-xs text-[rgb(var(--muted))]">No clauses available for this standard.</p>
              )
            ) : (
              <p className="p-4 text-xs text-[rgb(var(--muted))]">Select a standard to view clauses.</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          {explainClause.isPending ? (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent" />
              Loading explanation…
            </div>
          ) : explanation ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[rgb(var(--primary))]" />
                <h2 className="text-sm font-semibold">Clause Explanation</h2>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-medium text-[rgb(var(--muted))]">Explanation</p>
                  <p className="mt-1 text-[rgb(var(--text))]">{explanation.explanation ?? explanation.content ?? 'No explanation available.'}</p>
                </div>
                {explanation.intent && (
                  <div>
                    <p className="font-medium text-[rgb(var(--muted))]">Intent</p>
                    <p className="mt-1 text-[rgb(var(--text))]">{explanation.intent}</p>
                  </div>
                )}
                {explanation.evidenceRequired && (
                  <div>
                    <p className="font-medium text-[rgb(var(--muted))]">Evidence Required</p>
                    <p className="mt-1 text-[rgb(var(--text))]">{explanation.evidenceRequired}</p>
                  </div>
                )}
                {explanation.relatedClauses && explanation.relatedClauses.length > 0 && (
                  <div>
                    <p className="font-medium text-[rgb(var(--muted))]">Related Clauses</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {explanation.relatedClauses.map((c: string) => (
                        <span key={c} className="rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-[rgb(var(--text))]">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {explanation.bestPractices && (
                  <div>
                    <p className="font-medium text-[rgb(var(--muted))]">Best Practices</p>
                    <p className="mt-1 text-[rgb(var(--text))]">{explanation.bestPractices}</p>
                  </div>
                )}
                {explanation.implementationGuidance && (
                  <div>
                    <p className="font-medium text-[rgb(var(--muted))]">Implementation Guidance</p>
                    <p className="mt-1 text-[rgb(var(--text))]">{explanation.implementationGuidance}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="h-8 w-8 text-[rgb(var(--muted-2))]" />
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">Select a standard and clause to view its explanation.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
