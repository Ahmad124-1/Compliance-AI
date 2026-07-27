'use client';

import { useState } from 'react';
import {
  ClipboardCheck,
  ListChecks,
  FileText,
  Mic,
  AlertTriangle,
  BarChart3,
  Loader2,
  Plus,
  Download,
} from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Field } from '@/components/ui/Field.js';
import { useMutation, useQuery } from '@tanstack/react-query';

const MODES = [
  { key: 'planner', label: 'Planner', icon: ClipboardCheck },
  { key: 'checklist', label: 'Checklist Builder', icon: ListChecks },
  { key: 'review', label: 'Document Review', icon: FileText },
  { key: 'interview', label: 'Interview Assistant', icon: Mic },
  { key: 'findings', label: 'Findings Generator', icon: AlertTriangle },
  { key: 'report', label: 'Report Generator', icon: BarChart3 },
] as const;

interface AuditSession {
  id: string;
  mode: string;
  status: string;
  createdAt: string;
  result?: Record<string, unknown>;
}

export default function AuditAssistantPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]['key']>('planner');
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [activeSession, setActiveSession] = useState<AuditSession | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'audit', 'sessions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/audit/sessions');
      if (!res.ok) throw new Error('Failed to load sessions');
      return res.json();
    },
  });

  const createSession = useMutation({
    mutationFn: async (mode: string) => {
      const res = await fetch('/api/v1/ai/audit/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
    onSuccess: (data) => {
      const session: AuditSession = {
        id: data.id ?? `session_${Date.now()}`,
        mode,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setSessions((s) => [session, ...s]);
      setActiveSession(session);
    },
  });

  const runAction = useMutation({
    mutationFn: async ({ sessionId, action, input: actionInput }: { sessionId: string; action: string; input: string }) => {
      const res = await fetch(`/api/v1/ai/audit/sessions/${sessionId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, input: actionInput }),
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: (data) => setOutput(data.result ?? JSON.stringify(data, null, 2)),
  });

  const modeLabel = MODES.find((m) => m.key === mode)?.label ?? mode;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Audit Assistant</h1>
        <p className="text-sm text-[rgb(var(--muted))]">AI-powered audit planning, review and reporting</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${
                mode === m.key
                  ? 'border-[rgb(var(--primary))] font-medium text-[rgb(var(--text))]'
                  : 'border-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sessions</h2>
            <Button variant="outline" size="sm" onClick={() => createSession.mutate(mode)} disabled={createSession.isPending}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
          {isLoading ? (
            <p className="text-xs text-[rgb(var(--muted))]">Loading sessions…</p>
          ) : (
            <div className="space-y-2">
              {(data?.sessions ?? sessions).map((s: AuditSession) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`rounded border border-[rgb(var(--border-color))] px-3 py-2 cursor-pointer text-sm ${
                    activeSession?.id === s.id ? 'bg-[rgb(var(--panel-2))]' : 'hover:bg-[rgb(var(--panel-2))]'
                  }`}
                >
                  <p className="font-medium">{s.mode}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{s.status} · {new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">{modeLabel} Mode</h2>
          <Field label="Input">
            <Textarea
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter details for ${modeLabel.toLowerCase()}…`}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Button onClick={() => activeSession && runAction.mutate({ sessionId: activeSession.id, action: mode, input })} disabled={!activeSession || !input.trim() || runAction.isPending}>
              {runAction.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> : 'Run'}
            </Button>
            {output && (
              <Button variant="outline" size="sm" onClick={() => {
                const blob = new Blob([output], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_${mode}_${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4" /> Export
              </Button>
            )}
          </div>
          {output && (
            <pre className="whitespace-pre-wrap rounded border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4 text-xs text-[rgb(var(--text))] max-h-80 overflow-y-auto">{output}</pre>
          )}
          {!activeSession && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-8 w-8 text-[rgb(var(--muted-2))]" />
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">Create a new session to start using {modeLabel.toLowerCase()}.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
