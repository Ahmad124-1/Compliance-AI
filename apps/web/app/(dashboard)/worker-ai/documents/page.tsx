'use client';

import { useState, useCallback } from 'react';
import { Upload, FileCheck, Trash2, Eye, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { useWorkerAiDocuments, useUploadDocument } from '@/modules/worker-ai/store.js';
import { LANGUAGE_OPTIONS } from '@/modules/worker-ai/constants.js';

export default function WorkerAiDocumentsPage() {
  const { data: documents, isLoading } = useWorkerAiDocuments();
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');

  const handleUpload = useCallback(async () => {
    if (!file) return;
    await upload.mutateAsync({ file, language });
    setFile(null);
  }, [file, language, upload]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Document Assistant</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Upload, summarize, translate, and answer questions from documents.</p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Upload Document</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs text-[rgb(var(--muted))]">Select file (PDF, DOCX, Image)</label>
            <Input type="file" accept=".pdf,.docx,.doc,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-36"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>
          <Button onClick={handleUpload} disabled={!file || upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--panel-2))]">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Summary</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5}><Skeleton className="h-16 w-full" /></td></tr>
              )}
              {(documents ?? []).map((doc) => (
                <tr key={doc.id} className="border-t border-[rgb(var(--border-color))]">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[rgb(var(--primary))]" />
                    <span className="font-medium">{doc.filename}</span>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{doc.mimeType}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{(doc.sizeBytes / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{doc.summary ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (documents ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[rgb(var(--muted))]">No documents uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
