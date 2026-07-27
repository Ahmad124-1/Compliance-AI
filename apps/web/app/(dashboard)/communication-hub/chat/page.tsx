'use client';

import { useState } from 'react';
import { Send, Plus } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/Field.js';
import { useConversations } from '@/modules/communication-hub/store.js';

export default function ChatPage() {
  const { data: conversations, isLoading } = useConversations();
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (isLoading) {
    return <div className="mx-auto max-w-4xl"><p className="text-sm text-[rgb(var(--muted))]">Loading conversations...</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Real-Time Chat</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            One-to-one messaging, department groups, HR chat, compliance chat
          </p>
        </div>
        <Button><Plus className="h-4 w-4" /> New Conversation</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-4 md:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">Conversations</h2>
          <div className="space-y-2">
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv.id)}
                className={`w-full rounded-md p-2 text-left text-sm ${
                  selected === conv.id ? 'bg-[rgb(var(--panel-2))]' : 'hover:bg-[rgb(var(--panel-2))]'
                }`}
              >
                <p className="font-medium">{conv.title ?? 'Untitled'}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{conv.type} • {conv.category ?? 'general'}</p>
              </button>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-xs text-[rgb(var(--muted))]">No conversations yet</p>
            )}
          </div>
        </Card>

        <Card className="p-4 md:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Conversation</h2>
              <div className="min-h-[200px] rounded-md border border-[rgb(var(--border-color))] p-4">
                <p className="text-sm text-[rgb(var(--muted))]">Select a conversation to view messages</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-[rgb(var(--muted))]">Select a conversation to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
