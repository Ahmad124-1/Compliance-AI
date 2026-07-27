'use client';

import { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Field } from '@/components/ui/Field.js';
import { useMutation } from '@tanstack/react-query';

const ACTIONS = [
  'Summarize',
  'Explain',
  'Detect Gaps',
  'Highlight Risks',
  'Compare Standards',
  'Suggest Improvements',
  'Executive Summary',
  'Extract Findings',
];

export default function DocumentAiPage() {
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; size: string }>>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [action, setAction] = useState(ACTIONS[0]);
  const [dragOver, setDragOver] = useState(false);

  const analyze = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch('/api/v1/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, action }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      return res.json();
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => {
      const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setDocuments((d) => [...d, { id, name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` }]);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setDocuments((d) => [...d, { id, name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` }]);
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Document AI</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Upload and analyse compliance documents with AI</p>
      </div>

      <Card
        className={`border-dashed p-8 text-center transition-colors ${dragOver ? 'border-[rgb(var(--primary))] bg-[rgb(var(--panel-2))]' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-[rgb(var(--muted-2))]" />
        <p className="mt-2 text-sm font-medium">Drag and drop documents here</p>
        <p className="text-xs text-[rgb(var(--muted))]">PDF, DOCX, TXT up to 10MB</p>
        <Input type="file" className="mt-3 mx-auto max-w-xs" onChange={handleFileInput} accept=".pdf,.docx,.doc,.txt" />
      </Card>

      {documents.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Uploaded Documents</h2>
          <div className="space-y-2">
            {documents.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                className={`flex items-center justify-between rounded border border-[rgb(var(--border-color))] px-3 py-2 cursor-pointer text-sm ${
                  selectedDoc === d.id ? 'bg-[rgb(var(--panel-2))]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>{d.name}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{d.size}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedDoc && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[rgb(var(--primary))]" />
            <h2 className="text-sm font-semibold">Analyse Document</h2>
          </div>
          <Field label="Action">
            <select
              className="h-9 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-2 text-sm"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Button onClick={() => analyze.mutate(selectedDoc)} disabled={analyze.isPending}>
            {analyze.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : 'Analyse'}
          </Button>
        </Card>
      )}

      {analyze.data && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Result</h2>
          <pre className="whitespace-pre-wrap text-xs text-[rgb(var(--text))]">{JSON.stringify(analyze.data, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}
