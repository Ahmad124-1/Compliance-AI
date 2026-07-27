'use client';

import { useState } from 'react';
import { Megaphone, Pin, Send } from 'lucide-react';

import { Button, Card, Field, Input, Textarea, Skeleton, EmptyState, DataTable, type Column, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useAnnouncements, useWorkerPlatformUiStore } from '@/modules/worker-platform/store.js';
import type { Announcement } from '@/modules/worker-platform/types.js';

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const { data, isLoading, error, refetch } = useAnnouncements();
  const { filterCategory, setFilterCategory } = useWorkerPlatformUiStore();
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');

  const filtered = (data?.announcements ?? []).filter((a) => !filterCategory || a.category === filterCategory);

  const columns: Column<Announcement>[] = [
    { key: 'priority', header: 'Priority', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{r.priority}</span> },
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'category', header: 'Category', render: (r) => <span className="text-xs text-[rgb(var(--muted))]">{r.category}</span> },
    { key: 'date', header: 'Posted', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'pinned', header: 'Pinned', render: (r) => r.pinned ? <Pin className="h-4 w-4 text-[rgb(var(--primary))]" /> : null },
  ];

  if (error) return <div className="p-4 text-red-500">Failed to load announcements.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        {hasPermission('announcement:create') && <Button size="sm" onClick={() => setComposeOpen(true)}><Send className="h-4 w-4 mr-1" /> New Announcement</Button>}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Megaphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <Input placeholder="Search announcements…" disabled />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-40">
            <option value="">All categories</option>
            <option value="general">General</option>
            <option value="safety">Safety</option>
            <option value="training">Training</option>
            <option value="hr">HR</option>
          </select>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-48 w-full" /></Card>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No announcements yet." rowKey={(r) => r.id} />
      )}

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} title="New Announcement" description="Create a company-wide announcement." size="lg" footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button onClick={() => { toast({ title: 'Announcement created', variant: 'success' }); setComposeOpen(false); setTitle(''); setBody(''); }}>Publish</Button>
        </div>
      }>
        <div className="flex flex-col gap-3">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Body"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm">
                <option value="general">General</option>
                <option value="safety">Safety</option>
                <option value="training">Training</option>
                <option value="hr">HR</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Pinned</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Require Acknowledgement</label>
        </div>
      </Dialog>
    </div>
  );
}
