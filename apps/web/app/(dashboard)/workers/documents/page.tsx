'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

import { Card, Field, Input, Skeleton, EmptyState, DataTable, type Column } from '@/components/ui';
import { useDocuments, useWorkerPlatformUiStore } from '@/modules/worker-platform/store.js';
import { DOCUMENT_CATEGORY_LABELS } from '@/modules/worker-platform/constants.js';
import type { WorkerDocument } from '@/modules/worker-platform/types.js';

export default function DocumentsPage() {
  const { data: docs, isLoading, error, refetch } = useDocuments();
  const { filterDocCategory, setFilterDocCategory } = useWorkerPlatformUiStore();
  const filtered = (docs?.documents ?? []).filter((d) => !filterDocCategory || d.category === filterDocCategory);

  const columns: Column<WorkerDocument>[] = [
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'category', header: 'Category', render: (r) => <span className="text-xs text-[rgb(var(--muted))]">{DOCUMENT_CATEGORY_LABELS[r.category] ?? r.category}</span> },
    { key: 'fileName', header: 'File', render: (r) => r.fileName ?? '—' },
    { key: 'downloads', header: 'Downloads', render: (r) => <span className="text-sm">{r.downloadCount}</span> },
    { key: 'date', header: 'Updated', render: (r) => new Date(r.updatedAt).toLocaleDateString() },
  ];

  if (error) return <div className="p-4 text-red-500">Failed to load documents.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <Input placeholder="Search documents…" disabled />
          </div>
          <select value={filterDocCategory} onChange={(e) => setFilterDocCategory(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-48">
            <option value="">All categories</option>
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </Card>
      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No documents found." rowKey={(r) => r.id} />
      )}
    </div>
  );
}
