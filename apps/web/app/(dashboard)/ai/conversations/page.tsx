'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Pin,
  Trash2,
  Download,
  Share2,
} from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { DataTable } from '@/components/ui/DataTable.js';

interface ConversationRow {
  id: string;
  title: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export default function ConversationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'pinned'>('date');

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'chat', 'conversations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/chat/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/ai/chat/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'chat', 'conversations'] }),
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const res = await fetch(`/api/v1/ai/chat/conversations/${id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      if (!res.ok) throw new Error('Pin failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'chat', 'conversations'] }),
  });

  const rows: ConversationRow[] = useMemo(() => {
    const items = (data?.conversations ?? data ?? []) as Array<Record<string, unknown>>;
    return items
      .filter((c) => {
        const matchesSearch = !search.trim() || String(c.title ?? '').toLowerCase().includes(search.toLowerCase());
        const matchesTag = !tagFilter || (c.tags as string[] ?? []).includes(tagFilter);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'pinned') return Number(b.pinned ?? false) - Number(a.pinned ?? false);
        return new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime();
      })
      .map((c) => ({
        id: c.id as string,
        title: c.title as string,
        pinned: Boolean(c.pinned),
        tags: (c.tags as string[]) ?? [],
        createdAt: c.createdAt as string,
        updatedAt: c.updatedAt as string,
        messageCount: Number((c.messageCount as number) ?? ((c.turns as unknown as { length: number } | undefined)?.length ?? 0)),
      }));
  }, [data, search, tagFilter, sortBy]);

  const allTags = useMemo(() => {
    const items = (data?.conversations ?? data ?? []) as Array<Record<string, unknown>>;
    return Array.from(new Set(items.flatMap((c) => (c.tags as string[]) ?? [])));
  }, [data]);

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (row: ConversationRow) => <span className="flex items-center gap-1.5">{row.pinned && <Pin className="h-3 w-3 text-[rgb(var(--primary))]" />} {row.title}</span>,
      sortable: true,
      sortValue: (row: ConversationRow) => row.title,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (row: ConversationRow) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.map((t) => (
            <span key={t} className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-xs text-[rgb(var(--muted))]">{t}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (row: ConversationRow) => new Date(row.updatedAt).toLocaleString(),
      sortable: true,
      sortValue: (row: ConversationRow) => new Date(row.updatedAt).getTime(),
    },
    {
      key: 'messageCount',
      header: 'Messages',
      render: (row: ConversationRow) => row.messageCount,
      sortable: true,
      sortValue: (row: ConversationRow) => row.messageCount,
    },
    {
      key: 'actions',
      header: '',
      render: (row: ConversationRow) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => pinMutation.mutate({ id: row.id, pinned: !row.pinned })}>
            <Pin className={`h-4 w-4 ${row.pinned ? 'text-[rgb(var(--primary))]' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${row.title.replace(/[^a-z0-9]/gi, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(row));
            alert('Copied to clipboard');
          }}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete this conversation?')) deleteMutation.mutate(row.id); }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Conversation History</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Manage your AI conversations</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[200px] items-center gap-2">
            <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1"
            />
          </div>
          <select
            className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'pinned')}
          >
            <option value="date">Sort by date</option>
            <option value="pinned">Sort by pinned</option>
          </select>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="No conversations found."
        rowKey={(r) => r.id}
      />
    </div>
  );
}
