'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';

export default function KnowledgeCenterPage() {
  const [query, setQuery] = useState('');

  const resources = [
    { title: 'Worker Handbook', type: 'document', category: 'Policies' },
    { title: 'Safety Procedures', type: 'video', category: 'Safety' },
    { title: 'Labour Rights FAQ', type: 'faq', category: 'Rights' },
    { title: 'Emergency Procedures', type: 'document', category: 'Safety' },
    { title: 'Overtime Policy', type: 'document', category: 'Policies' },
    { title: 'Leave & Benefits', type: 'faq', category: 'Benefits' },
  ];

  const filtered = query
    ? resources.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase())
      )
    : resources;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Center</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Worker handbook, policies, safety procedures, videos, FAQs, and labour rights
        </p>
      </div>

      <Card className="p-4">
        <Field label="Search" error={undefined}>
          <Input
            placeholder="Search resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {filtered.map((r) => (
          <Card key={r.title} className="p-4 hover:border-[rgb(var(--ring))]">
            <p className="text-sm font-semibold">{r.title}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{r.category}</p>
            <span className="mt-2 inline-block rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs capitalize">
              {r.type}
            </span>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No resources found matching your search.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
