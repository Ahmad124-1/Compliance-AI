'use client';

import { useState } from 'react';
import { PenLine, Download, CheckCircle2, XCircle, Clock } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Field } from '@/components/ui/Field.js';
import { useMutation } from '@tanstack/react-query';

const POLICY_TYPES = [
  'Child Labour',
  'Forced Labour',
  'Health & Safety',
  'Environmental',
  'Human Rights',
  'Anti-Harassment',
  'Supplier Code of Conduct',
  'Ethics',
];

const EXPORT_FORMATS = [
  { key: 'pdf', label: 'PDF' },
  { key: 'docx', label: 'DOCX' },
  { key: 'html', label: 'HTML' },
  { key: 'markdown', label: 'Markdown' },
];

interface PolicyVersion {
  id: string;
  version: string;
  title: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
}

export default function PolicyGeneratorPage() {
  const [policyType, setPolicyType] = useState(POLICY_TYPES[0]);
  const [context, setContext] = useState('');
  const [generated, setGenerated] = useState<{ title: string; content: string; version: string } | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [exportFormat, setExportFormat] = useState('pdf');

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/ai/policies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: policyType, context }),
      });
      if (!res.ok) throw new Error('Generation failed');
      return res.json();
    },
    onSuccess: (data) => {
      setGenerated(data);
      setVersions((v) => [
        ...v,
        {
          id: `v_${Date.now()}`,
          version: data.version ?? `1.${v.length + 1}`,
          title: data.title,
          status: 'pending_approval',
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  const approve = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch('/api/v1/ai/policies/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) throw new Error('Approval failed');
      return res.json();
    },
    onSuccess: (_, versionId) => {
      setVersions((v) => v.map((x) => x.id === versionId ? { ...x, status: 'approved' } : x));
    },
  });

  const reject = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch('/api/v1/ai/policies/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      return res.json();
    },
    onSuccess: (_, versionId) => {
      setVersions((v) => v.map((x) => x.id === versionId ? { ...x, status: 'rejected' } : x));
    },
  });

  const exportPolicy = () => {
    if (!generated) return;
    const blob = new Blob([generated.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generated.title.replace(/[^a-z0-9]/gi, '_')}.${exportFormat === 'markdown' ? 'md' : exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestVersion = versions[0];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Policy Generator</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Generate compliance policies with AI assistance</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-[rgb(var(--primary))]" />
            <h2 className="text-sm font-semibold">Generate Policy</h2>
          </div>
          <Field label="Policy Type">
            <select
              className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm"
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
            >
              {POLICY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Context">
            <Textarea
              rows={4}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe the context, scope, and specific requirements for this policy…"
            />
          </Field>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending || !context.trim()}>
            {generate.isPending ? 'Generating…' : 'Generate Policy'}
          </Button>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Version History</h2>
          <div className="space-y-2">
            {versions.length === 0 && <p className="text-xs text-[rgb(var(--muted))]">No versions yet.</p>}
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded border border-[rgb(var(--border-color))] px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{v.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">v{v.version} · {new Date(v.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                  v.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                  v.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                  v.status === 'pending_approval' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'
                }`}>
                  {v.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                  {v.status === 'rejected' && <XCircle className="h-3 w-3" />}
                  {v.status === 'pending_approval' && <Clock className="h-3 w-3" />}
                  {v.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {generated && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Generated Policy</h2>
            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-xs"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                {EXPORT_FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={exportPolicy}><Download className="h-4 w-4" /> Export</Button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold">{generated.title}</h3>
            <p className="text-xs text-[rgb(var(--muted))]">Version: {generated.version}</p>
            <pre className="whitespace-pre-wrap rounded border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4 text-xs text-[rgb(var(--text))]">{generated.content}</pre>
          </div>
          {latestVersion?.status === 'pending_approval' && (
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={() => approve.mutate(latestVersion.id)} disabled={approve.isPending}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
              <Button variant="outline" onClick={() => reject.mutate(latestVersion.id)} disabled={reject.isPending}><XCircle className="h-4 w-4" /> Reject</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
