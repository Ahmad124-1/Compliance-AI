'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  Search,
  Pin,
  Trash2,
  Download,
  Share2,
  X,
  PenLine,
} from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Drawer } from '@/components/ui/Drawer.js';
import { cn } from '@/lib/cn.js';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: { source: string; snippet: string }[];
}

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  turns: Turn[];
}

const SUGGESTIONS = [
  'What are the key requirements of SA8000?',
  'Explain forced labour provisions under ILO conventions.',
  'Summarise my latest audit findings for ISO 45001.',
  'How do I close a CAPA effectively?',
  'What evidence is needed for a supplier audit?',
  'Generate a checklist for SMETA audit.',
];

export default function AiChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'rename' | 'tag' | null>(null);
  const [tagInput, setTagInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [conversations, search]);

  const createConversation = useCallback(() => {
    const id = `conv_${Date.now()}`;
    const conv: Conversation = {
      id,
      title: 'New Conversation',
      pinned: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: [],
    };
    setConversations((c) => [conv, ...c]);
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const exportConversation = useCallback((conv: Conversation) => {
    const blob = new Blob(
      [JSON.stringify(conv, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const shareConversation = useCallback(async (conv: Conversation) => {
    const text = `${conv.title}\n\n${conv.turns.map((t) => `${t.role === 'user' ? 'You' : 'AI'}: ${t.content}`).join('\n\n')}`;
    await navigator.clipboard.writeText(text);
    alert('Conversation copied to clipboard');
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.turns.length]);

  const sendMessage = useCallback(async () => {
    if (!activeId || !draft.trim() || isSending) return;
    const message = draft.trim();
    setDraft('');

    setConversations((c) =>
      c.map((x) =>
        x.id === activeId
          ? {
              ...x,
              title: x.title === 'New Conversation' ? message.slice(0, 40) : x.title,
              updatedAt: Date.now(),
              turns: [...x.turns, { id: `t_${Date.now()}`, role: 'user', content: message, timestamp: Date.now() }],
            }
          : x,
      ),
    );

    const assistantTurnId = `t_${Date.now()}`;
    setConversations((c) =>
      c.map((x) =>
        x.id === activeId
          ? { ...x, updatedAt: Date.now(), turns: [...x.turns, { id: assistantTurnId, role: 'assistant', content: '', timestamp: Date.now() }] }
          : x,
      ),
    );

    setIsSending(true);
    try {
      const token = (await import('@/lib/auth/storage.js')).tokenStorage.getAccessToken();
      const res = await fetch('/api/v1/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ conversationId: activeId, message, useRag: true }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const payload = line.slice(6);
              if (payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                const delta = parsed.choices?.[0]?.delta?.content ?? parsed.text ?? '';
                fullText += delta;
                setConversations((c) =>
                  c.map((x) =>
                    x.id === activeId
                      ? { ...x, turns: x.turns.map((t) => t.id === assistantTurnId ? { ...t, content: fullText } : t) }
                      : x,
                  ),
                );
              } catch {
                fullText += payload;
                setConversations((c) =>
                  c.map((x) =>
                    x.id === activeId
                      ? { ...x, turns: x.turns.map((t) => t.id === assistantTurnId ? { ...t, content: fullText } : t) }
                      : x,
                  ),
                );
              }
            }
          }
        }
      }
    } catch (e) {
      setConversations((c) =>
        c.map((x) =>
          x.id === activeId
            ? {
                ...x,
                turns: x.turns.map((t) => t.id === assistantTurnId ? { ...t, content: `Error: ${(e as Error).message}` } : t),
              }
            : x,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }, [activeId, draft, isSending]);

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-semibold mt-3 mb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-lg font-semibold mt-3 mb-1">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`{3}(\w+)?\n([\s\S]*?)`{3}/g, '<pre class="bg-[rgb(var(--panel-2))] p-2 rounded text-xs overflow-x-auto my-2"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-[rgb(var(--panel-2))] px-1 rounded text-xs">$1</code>')
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  if (!activeConversation) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">AI Chat</h1>
            <p className="text-sm text-[rgb(var(--muted))]">Enterprise conversational assistant</p>
          </div>
          <Button onClick={createConversation}><Plus className="h-4 w-4" /> New Chat</Button>
        </div>
        <Card className="p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[rgb(var(--muted-2))]" />
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">Start a new conversation or select an existing one from the sidebar.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} variant="outline" size="sm" onClick={() => { createConversation(); setDraft(s); }}>
                {s}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Chat</h1>
          <p className="text-sm text-[rgb(var(--muted))]">{activeConversation.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDrawerMode('rename')}><PenLine className="h-4 w-4" /> Rename</Button>
          <Button variant="outline" size="sm" onClick={() => exportConversation(activeConversation)}><Download className="h-4 w-4" /> Export</Button>
          <Button variant="outline" size="sm" onClick={() => shareConversation(activeConversation)}><Share2 className="h-4 w-4" /> Share</Button>
          <Button variant="outline" size="sm" onClick={() => deleteConversation(activeId!)}><Trash2 className="h-4 w-4" /></Button>
          <Button onClick={createConversation}><Plus className="h-4 w-4" /> New Chat</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1 flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  'w-full border-b border-[rgb(var(--border-color))] px-3 py-2.5 text-left text-sm transition-colors',
                  c.id === activeId ? 'bg-[rgb(var(--panel-2))]' : 'hover:bg-[rgb(var(--panel-2))]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate flex-1">{c.title}</span>
                  {c.pinned && <Pin className="h-3 w-3 shrink-0 text-[rgb(var(--primary))]" />}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs text-[rgb(var(--muted))]">{new Date(c.updatedAt).toLocaleDateString()}</span>
                  {c.tags.map((t) => (
                    <span key={t} className="rounded bg-[rgb(var(--panel-2))] px-1 py-0.5 text-[10px] text-[rgb(var(--muted))]">{t}</span>
                  ))}
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <p className="p-4 text-xs text-[rgb(var(--muted))]">No conversations found.</p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-3 flex flex-col p-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {activeConversation.turns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="h-8 w-8 text-[rgb(var(--muted-2))]" />
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">Ask about compliance clauses, CAPAs, audits, suppliers or grievances.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => setDraft(s)}>{s}</Button>
                  ))}
                </div>
              </div>
            )}
            {activeConversation.turns.map((t) => (
              <div key={t.id} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {t.role === 'assistant' && <Bot className="mt-1 h-5 w-5 shrink-0 text-[rgb(var(--primary))]" />}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    t.role === 'user'
                      ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                      : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]'
                  }`}
                  dangerouslySetInnerHTML={t.role === 'assistant' ? renderMarkdown(t.content) : undefined}
                >
                  {t.role === 'user' ? t.content : undefined}
                </div>
                {t.role === 'user' && <User className="mt-1 h-5 w-5 shrink-0 text-[rgb(var(--muted))]" />}
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3 justify-start">
                <Bot className="mt-1 h-5 w-5 shrink-0 text-[rgb(var(--primary))]" />
                <div className="rounded-lg bg-[rgb(var(--panel-2))] px-4 py-3 text-sm text-[rgb(var(--muted))]">Thinking…</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-[rgb(var(--border-color))] p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Ask the compliance assistant…"
              className="min-h-[40px] max-h-32"
              rows={1}
            />
            <Button onClick={sendMessage} disabled={!draft.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerMode === 'rename' ? 'Rename Conversation' : 'Manage Tags'}>
        {drawerMode === 'rename' && (
          <div className="space-y-3">
            <Input
              defaultValue={activeConversation?.title}
              onBlur={(e) => {
                if (activeId && e.target.value.trim()) {
                  setConversations((c) => c.map((x) => x.id === activeId ? { ...x, title: e.target.value.trim() } : x));
                }
                setDrawerOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (activeId && val) setConversations((c) => c.map((x) => x.id === activeId ? { ...x, title: val } : x));
                  setDrawerOpen(false);
                }
              }}
              autoFocus
            />
          </div>
        )}
        {drawerMode === 'tag' && (
          <div className="space-y-3">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim() && activeId) {
                  setConversations((c) =>
                    c.map((x) => x.id === activeId ? { ...x, tags: [...x.tags, tagInput.trim()] } : x),
                  );
                  setTagInput('');
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {activeConversation?.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-xs">
                  {t}
                  <button onClick={() => setConversations((c) => c.map((x) => x.id === activeId ? { ...x, tags: x.tags.filter((y) => y !== t) } : x))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
