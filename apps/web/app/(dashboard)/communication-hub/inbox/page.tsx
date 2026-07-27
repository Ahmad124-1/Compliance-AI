'use client';

import { useState } from 'react';
import { Bell, Search, MailOpen, Mail } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/Field.js';
import { useInbox } from '@/modules/communication-hub/store.js';

export default function InboxPage() {
  const { data: inbox } = useInbox();
  const [search, setSearch] = useState('');

  const messages = inbox?.messages ?? [];
  const filtered = messages.filter((m) => {
    const term = search.toLowerCase();
    return (m.subject ?? '').toLowerCase().includes(term) || m.body.toLowerCase().includes(term);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Personal messages, announcements, and notifications
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
        <Input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((msg) => (
          <Card key={msg.id} className={`p-4 ${!msg.readAt ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {msg.readAt ? <MailOpen className="h-4 w-4 text-[rgb(var(--muted))]" /> : <Mail className="h-4 w-4 text-blue-500" />}
                  <p className="font-medium">{msg.subject ?? 'No Subject'}</p>
                  <span className="text-xs text-[rgb(var(--muted))]">{msg.category}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{msg.priority}</span>
                </div>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{msg.body}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{new Date(msg.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-[rgb(var(--muted))]" />
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">No messages yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
