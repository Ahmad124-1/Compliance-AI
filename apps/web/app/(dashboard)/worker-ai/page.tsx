'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, Bot, User, Plus, Search, Trash2, Download, Mic, MicOff } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { cn } from '@/lib/cn.js';
import { useWorkerAiChat } from '@/modules/worker-ai/store.js';
import { LANGUAGE_OPTIONS } from '@/modules/worker-ai/constants.js';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  language: string;
  context: Record<string, unknown>;
  bookmarked: boolean;
  createdAt: number;
  updatedAt: number;
  turns: Turn[];
}

const SUGGESTIONS = [
  'Explain my leave entitlement.',
  'What are my health and safety rights?',
  'How do I report overtime concerns?',
  'Explain the grievance process.',
  'What training is available?',
  'Explain factory emergency procedure.',
];

export default function WorkerAiChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string>('en');
  const [useRag, setUseRag] = useState(true);
  const [useVoice, setUseVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const { mutate: sendChat } = useWorkerAiChat();

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const createConversation = useCallback(() => {
    const id = `conv_${Date.now()}`;
    const conv: Conversation = {
      id,
      title: 'New Conversation',
      language: language,
      context: {},
      bookmarked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: [],
    };
    setConversations((c) => [conv, ...c]);
    setActiveId(id);
  }, [language]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const exportConversation = useCallback((conv: Conversation) => {
    const blob = new Blob([JSON.stringify(conv, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    const conversationId = activeId;

    setConversations((c) =>
      c.map((x) =>
        x.id === conversationId
          ? {
              ...x,
              title: x.title === 'New Conversation' ? message.slice(0, 50) : x.title,
              updatedAt: Date.now(),
              turns: [...x.turns, { id: `t_${Date.now()}`, role: 'user', content: message, timestamp: Date.now() }],
            }
          : x,
      ),
    );

    setIsSending(true);
    try {
      const res = await new Promise<{ conversation: any; message: any }>((resolve, reject) => {
        sendChat(
          { conversationId, message, language: language as any, useRag },
          { onSuccess: resolve, onError: reject },
        );
      });

      const assistantTurn: Turn = {
        id: `t_${Date.now()}`,
        role: 'assistant',
        content: res.message.content,
        timestamp: Date.now(),
      };
      setConversations((c) =>
        c.map((x) =>
          x.id === conversationId
            ? { ...x, updatedAt: Date.now(), turns: [...x.turns, assistantTurn] }
            : x,
        ),
      );
    } catch (e) {
      const error = e as Error;
      setConversations((c) =>
        c.map((x) =>
          x.id === conversationId
            ? { ...x, turns: [...x.turns, { id: `t_${Date.now()}`, role: 'assistant', content: `Error: ${error.message}`, timestamp: Date.now() }] }
            : x,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }, [activeId, draft, isSending, language, useRag, sendChat]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">AI Worker Assistant</h1>
            <p className="text-sm text-[rgb(var(--muted))]">Multilingual digital companion for workplace questions</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-36"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
            <Button onClick={createConversation}><Plus className="h-4 w-4" /> New Chat</Button>
          </div>
        </div>
        <Card className="p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[rgb(var(--muted-2))]" />
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">Ask about policies, rights, safety, benefits, leave, overtime, payroll, training, grievances, or factory procedures.</p>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI Worker Assistant</h1>
          <p className="text-sm text-[rgb(var(--muted))]">{activeConversation.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-36"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>
          <select
            value={useRag ? 'rag' : 'simple'}
            onChange={(e) => setUseRag(e.target.value === 'rag')}
            className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-32"
          >
            <option value="rag">Company KB</option>
            <option value="simple">General AI</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setUseVoice(!useVoice)}>
            {useVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportConversation(activeConversation)}><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => deleteConversation(activeId!)}><Trash2 className="h-4 w-4" /></Button>
          <Button onClick={createConversation}><Plus className="h-4 w-4" /> New</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1 flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3">
            <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
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
                <span className="truncate block">{c.title}</span>
                <span className="text-xs text-[rgb(var(--muted))]">{new Date(c.updatedAt).toLocaleDateString()}</span>
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
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">Ask about company policies, rights, safety, benefits, leave, overtime, payroll, training, grievances, or factory procedures.</p>
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
              placeholder="Ask the worker assistant…"
              className="min-h-[40px] max-h-32"
              rows={1}
            />
            <Button onClick={sendMessage} disabled={!draft.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
