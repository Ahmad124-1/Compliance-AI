'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Loader2,
  Calculator,
  FileBarChart,
  ShieldCheck,
} from 'lucide-react';

import { useChat, useAiConfig } from '@/modules/ai/hooks.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { Input } from '@/components/ui/input.js';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const CONTEXT_HINTS: Record<string, { label: string; suggestions: string[] }> = {
  '/dashboard/sustainability': {
    label: 'Sustainability',
    suggestions: ['Summarise my sustainability programs', 'What ESG goals are at risk?', 'How do I set a new KPI?'],
  },
  '/dashboard/carbon': {
    label: 'Carbon & GHG',
    suggestions: ['Explain Scope 1, 2 and 3 emissions', 'How do I calculate GHG emissions?', 'What is an emission factor?'],
  },
  '/dashboard/environment': {
    label: 'Environmental',
    suggestions: ['Summarise environmental incidents', 'How do I log water usage?', 'Explain ISO 14001 requirements'],
  },
  '/dashboard/esg': {
    label: 'ESG',
    suggestions: ['What is GRI reporting?', 'Explain IFRS S1 and S2', 'How do I run a materiality assessment?'],
  },
  '/suppliers': {
    label: 'Suppliers',
    suggestions: ['How do I assess supplier ESG?', 'Explain responsible sourcing', 'How do I audit a supplier?'],
  },
  '/supplier': {
    label: 'Suppliers',
    suggestions: ['How do I assess supplier ESG?', 'Explain responsible sourcing', 'How do I audit a supplier?'],
  },
  '/audits': {
    label: 'Compliance',
    suggestions: ['Explain the audit process', 'How do I close a CAPA?', 'What evidence is needed for an audit?'],
  },
  '/capa': {
    label: 'Compliance',
    suggestions: ['How do I create a CAPA?', 'Explain root cause analysis', 'What is a corrective action?'],
  },
  '/risk': {
    label: 'Compliance',
    suggestions: ['How do I register a risk?', 'Explain risk assessment', 'What is a risk register?'],
  },
  '/policies': {
    label: 'Compliance',
    suggestions: ['What policies do I need for ISO 14001?', 'Explain policy management', 'How do I generate a policy?'],
  },
  '/documents': {
    label: 'Compliance',
    suggestions: ['How do I analyse a document?', 'Explain document intelligence', 'What is a knowledge base?'],
  },
  '/admin': {
    label: 'Administration',
    suggestions: ['How do I add a user?', 'Explain roles and permissions', 'How do I configure an organization?'],
  },
};

const DEFAULT_SUGGESTIONS = [
  'Explain sustainability reporting frameworks',
  'How do I calculate my carbon footprint?',
  'What are the key ESG disclosure requirements?',
  'Generate a compliance report summary',
];

export function FloatingAiAssistant() {
  const pathname = usePathname();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chat = useChat();
  const { data: config } = useAiConfig();

  const disabled = config?.provider === 'null';

  const conversationId = useMemo(() => {
    if (typeof window === 'undefined') return 'conv_floating';
    return `conv_floating_${session?.organization.id ?? 'anon'}`;
  }, [session?.organization.id]);

  const context = useMemo(() => {
    for (const prefix of Object.keys(CONTEXT_HINTS)) {
      if (pathname.startsWith(prefix)) return CONTEXT_HINTS[prefix];
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  async function send(message?: string) {
    const text = (message ?? draft).trim();
    if (!text || chat.isPending) return;
    setDraft('');

    setTurns((t) => [
      ...t,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);

    try {
      const res = await chat.mutateAsync({
        conversationId,
        message: text,
        useRag: true,
        systemPrompt: `You are the ComplianceOS AI Sustainability Assistant. The user is currently on the "${context?.label ?? 'Dashboard'}" page. Help them with sustainability, ESG, carbon accounting, GHG, environmental compliance, supplier ESG, and compliance requirements. Be concise, accurate and practical.`,
      });
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = { role: 'assistant', content: res.text };
        return next;
      });
    } catch (e) {
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = {
          role: 'assistant',
          content: `I encountered an error: ${(e as Error).message}. Please try again.`,
        };
        return next;
      });
    }
  }

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-[var(--shadow-lg)] transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[70] flex h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] shadow-[var(--shadow-lg)]">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--primary))]">
              <Sparkles className="h-4 w-4 text-[rgb(var(--primary-foreground))]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Sustainability AI</p>
              <p className="truncate text-xs text-[rgb(var(--muted))]">
                {context ? `Context: ${context.label}` : 'Assists across the platform'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md p-1 text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel))] hover:text-[rgb(var(--text))]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {turns.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm leading-relaxed text-[rgb(var(--text))]">
                  {disabled
                    ? 'AI provider is disabled. Configure a provider in AI settings to enable conversational assistance.'
                    : 'Hello! I can help you with sustainability, ESG, carbon accounting, GHG calculations, environmental compliance, supplier ESG and reporting. Ask me anything about the current page.'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(context?.suggestions ?? DEFAULT_SUGGESTIONS).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-2.5 py-1 text-xs text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--text))]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {!disabled && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => send('Calculate GHG emissions from activity data for me.')}
                      className="flex items-center gap-1 rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--text))]"
                    >
                      <Calculator className="h-3 w-3" /> Calculate GHG
                    </button>
                    <button
                      type="button"
                      onClick={() => send('Help me generate a sustainability report.')}
                      className="flex items-center gap-1 rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--text))]"
                    >
                      <FileBarChart className="h-3 w-3" /> Generate Report
                    </button>
                    <button
                      type="button"
                      onClick={() => send('Explain the key compliance requirements for this page.')}
                      className="flex items-center gap-1 rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--text))]"
                    >
                      <ShieldCheck className="h-3 w-3" /> Explain Compliance
                    </button>
                  </div>
                )}
              </div>
            )}
            {turns.map((t, i) => (
              <div
                key={i}
                className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {t.role === 'assistant' && (
                  <Bot className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--primary))]" />
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    t.role === 'user'
                      ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                      : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]'
                  }`}
                >
                  {t.content || '…'}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-[rgb(var(--border-color))] px-4 py-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={disabled ? 'Provider disabled' : 'Ask the sustainability assistant…'}
              disabled={disabled || chat.isPending}
              className="min-h-[36px] text-sm"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={disabled || chat.isPending || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] disabled:opacity-50"
            >
              {chat.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
