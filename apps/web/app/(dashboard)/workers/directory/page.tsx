'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { Card, Input, Skeleton, EmptyState, DataTable, type Column } from '@/components/ui';
import { useWorkerDirectory, useWorkerPlatformUiStore } from '@/modules/worker-platform/store.js';
import type { WorkerDirectoryEntry } from '@/modules/worker-platform/types.js';

export default function DirectoryPage() {
  const { searchDirectory, setSearchDirectory } = useWorkerPlatformUiStore();
  const { data, isLoading, error, refetch } = useWorkerDirectory({ query: searchDirectory || undefined });

  const columns: Column<WorkerDirectoryEntry>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: 'email', header: 'Email', render: (r) => <span className="text-sm">{r.email}</span> },
    { key: 'position', header: 'Position', render: (r) => r.position ?? '—' },
    { key: 'department', header: 'Department', render: (r) => r.departmentName ?? '—' },
    { key: 'site', header: 'Factory', render: (r) => r.siteName ?? '—' },
    { key: 'skills', header: 'Skills', render: (r) => r.skills.slice(0, 3).map((s) => <span key={s} className="mr-1 rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-xs">{s}</span>) },
  ];

  if (error) return <div className="p-4 text-red-500">Failed to load directory. <button className="underline" onClick={() => refetch()}>Retry</button></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Worker Directory</h1>
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input placeholder="Search workers, skills, departments…" value={searchDirectory} onChange={(e) => setSearchDirectory(e.target.value)} className="pl-9" />
        </div>
      </Card>
      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ) : (
        <DataTable columns={columns} data={data?.workers ?? []} isLoading={isLoading} emptyMessage="No workers found." rowKey={(r) => r.id} />
      )}
    </div>
  );
}
