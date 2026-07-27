'use client';

import { useEffect, useState } from 'react';
import { Settings2, CheckCircle2, XCircle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Field } from '@/components/ui/Field.js';
import { useAiConfig, useUpdateAiConfig, useAiProviders } from '@/modules/ai/hooks.js';
import { AI_PROVIDER_LABELS, AI_EMBEDDING_LABELS } from '@/modules/ai/constants.js';

const CHAT_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest', 'claude-sonnet-4', 'claude-opus-4'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  azure: ['complianceos-ai'],
  ollama: ['llama3.1', 'mistral', 'mixtral', 'phi3'],
};

const EMBEDDING_MODELS: Record<string, string[]> = {
  openai: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  azure: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  ollama: ['nomic-embed-text', 'all-minilm'],
};

export function AiConfigPanel() {
  const { data, isLoading } = useAiConfig();
  const update = useUpdateAiConfig();
  const { data: providers } = useAiProviders();
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (data) setForm(data as unknown as Record<string, unknown>);
  }, [data]);

  if (isLoading) return <Card className="p-4 text-sm text-[rgb(var(--muted))]">Loading configuration…</Card>;
  if (!data) return <Card className="p-4 text-sm text-[rgb(var(--muted))]">No configuration found.</Card>;

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    await update.mutateAsync(form as any);
  }

  const chatConfigured = (providers?.providers ?? []).find((p) => p.kind === form.provider)?.chatConfigured ?? false;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-[rgb(var(--primary))]" />
        <h2 className="text-sm font-semibold">AI Settings</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Chat Provider">
          <select className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm" value={String(form.provider)} onChange={(e) => set('provider', e.target.value)}>
            {Object.entries(AI_PROVIDER_LABELS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </Field>

        <Field label="Embedding Provider">
          <select className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm" value={String(form.embeddingProvider)} onChange={(e) => set('embeddingProvider', e.target.value)}>
            {Object.entries(AI_EMBEDDING_LABELS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </Field>

        <Field label="Chat Model">
          <select className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm" value={String(form.model)} onChange={(e) => set('model', e.target.value)}>
            {(CHAT_MODELS[String(form.provider)] ?? [String(form.model)]).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Embedding Model">
          <select className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm" value={String(form.embeddingModel)} onChange={(e) => set('embeddingModel', e.target.value)}>
            {(EMBEDDING_MODELS[String(form.embeddingProvider)] ?? [String(form.embeddingModel)]).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Temperature" hint="0 = deterministic, 2 = creative">
          <Input type="number" step="0.1" min={0} max={2} value={Number(form.temperature)} onChange={(e) => set('temperature', Number(e.target.value))} />
        </Field>

        <Field label="Max Tokens">
          <Input type="number" step={256} min={1} max={32000} value={Number(form.maxTokens)} onChange={(e) => set('maxTokens', Number(e.target.value))} />
        </Field>

        <Field label="RAG Top-K" hint="Number of chunks retrieved">
          <Input type="number" min={0} max={50} value={Number(form.ragTopK)} onChange={(e) => set('ragTopK', Number(e.target.value))} />
        </Field>

        <Field label="RAG Min Score" hint="0–1 similarity threshold">
          <Input type="number" step="0.05" min={0} max={1} value={Number(form.ragMinScore)} onChange={(e) => set('ragMinScore', Number(e.target.value))} />
        </Field>

        <Field label="Rate Limit (requests/min)">
          <Input type="number" min={1} value={Number(form.rateLimitRpm)} onChange={(e) => set('rateLimitRpm', Number(e.target.value))} />
        </Field>

        <Field label="Rate Limit (tokens/min)">
          <Input type="number" min={1} value={Number(form.rateLimitTpm)} onChange={(e) => set('rateLimitTpm', Number(e.target.value))} />
        </Field>
      </div>

      <Field label="System Prompt (optional)">
        <Textarea rows={3} value={String(form.systemPrompt ?? '')} onChange={(e) => set('systemPrompt', e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(['enableAudit', 'enableSupplier', 'enableCapa', 'enableGrievance', 'enableEvidence', 'enablePolicy'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-xs text-[rgb(var(--text))]">
            <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => set(k, e.target.checked)} />
            {k.replace('enable', '').replace(/([A-Z])/g, ' $1')}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {form.provider !== 'null' && (
          chatConfigured ? (
            <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="h-4 w-4" /> Provider configured</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-500"><XCircle className="h-4 w-4" /> Missing API key for this provider</span>
          )
        )}
      </div>
    </Card>
  );
}
