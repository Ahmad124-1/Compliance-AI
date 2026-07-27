'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useBroadcasts, useCreateBroadcast } from '@/modules/communication-hub/store.js';
import { BROADCAST_TYPES } from '@/modules/communication-hub/constants.js';

export default function BroadcastsPage() {
  const { data: broadcasts, isLoading } = useBroadcasts();
  const create = useCreateBroadcast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [broadcastType, setBroadcastType] = useState('company');
  const [priority, setPriority] = useState('normal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ title, body, broadcastType, priority });
    setTitle('');
    setBody('');
    setShowForm(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Broadcasts</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Company, department, and factory announcements</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> New Broadcast
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Create Broadcast</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title" error={undefined}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Body" error={undefined}>
              <textarea
                className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" error={undefined}>
                <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={broadcastType} onChange={(e) => setBroadcastType(e.target.value)}>
                  {BROADCAST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Priority" error={undefined}>
                <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </div>
            <Button type="submit">Send Broadcast</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-[rgb(var(--muted))]">Loading...</p>}
        {(broadcasts ?? []).map((b) => (
          <Card key={b.id} className={`p-4 ${b.pinned ? 'border-l-4 border-l-yellow-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{b.broadcastType} • {b.priority} • {new Date(b.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-sm">{b.body}</p>
              </div>
              {b.pinned && <span className="text-xs text-[rgb(var(--muted))]">Pinned</span>}
            </div>
          </Card>
        ))}
        {(!broadcasts || broadcasts.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No broadcasts yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
