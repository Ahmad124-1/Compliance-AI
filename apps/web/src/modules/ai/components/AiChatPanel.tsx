'use client';

import { useState } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useChat, useAiConfig, useMemoryScope } from '@/modules/ai/hooks.js';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

export function AiChatPanel({ supplierId, auditId }: { supplierId?: string; auditId?: string }) {
  const conversationId = useState(() => `conv_${crypto.randomUUID()}`)[0];
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [useRag, setUseRag] = useState(true);
  const chat = useChat();
  const { data: config } = useAiConfig();
  const _memory = useMemoryScope('conversation', conversationId);


  const disabled = config?.provider === 'null';

  async function send() {
    const message = draft.trim();
    if (!message || chat.isPending) return;
    setDraft('');
    setTurns((t) => [...t, { role: 'user', content: message }, { role: 'assistant', content: '' }]);
    try {
      const res = await chat.mutateAsync({ conversationId, message, supplierId, auditId, useRag });
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = { role: 'assistant', content: res.text };
        return next;
      });
    } catch (e) {
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = { role: 'assistant', content: `Error: ${(e as Error).message}` };
        return next;
      });
    }
  }

  return (
    <Card className="flex h-[580px] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border-color))] px-4 py-3">
        <Sparkles className="h-5 w-5 text-[rgb(var(--primary))]" />
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
          <input type="checkbox" checked={useRag} onChange={(e) => setUseRag(e.target.checked)} />
          Use knowledge base (RAG)
        </label>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {turns.length === 0 && (
          <p className="text-xs text-[rgb(var(--muted))]">
            {disabled
              ? 'AI provider is disabled. Configure a provider in AI Settings to enable conversational assistance.'
              : 'Ask about compliance clauses, CAPAs, audits, suppliers or grievances. Responses are grounded in your knowledge base.'}
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {t.role === 'assistant' && <Bot className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--primary))]" />}
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${t.role === 'user' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]'}`}>
              {t.content || '…'}
            </div>
            {t.role === 'user' && <User className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--muted))]" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-[rgb(var(--border-color))] px-4 py-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={disabled ? 'Provider disabled' : 'Ask the compliance assistant…'}
          disabled={disabled || chat.isPending}
        />
        <Button onClick={send} disabled={disabled || chat.isPending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
