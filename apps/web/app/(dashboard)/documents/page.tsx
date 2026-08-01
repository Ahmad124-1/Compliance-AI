'use client';

import { useMemo, useRef, useState } from 'react';
import { FolderOpen, Search, Upload, X, Eye, Zap, Sparkles, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/states.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { documentsService } from '@/modules/documents/service.js';
import { DOCUMENT_ACTIONS } from '@/modules/documents/constants.js';
import type { DocumentRecord, DocumentAnalysis } from '@/modules/documents/types.js';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

const STATUS_STYLES: Record<string, string> = {
  uploaded: 'bg-gray-100 text-gray-800',
  processing: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-800',
};

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.listDocuments(),
  });

  const filtered = useMemo(() => {
    const list = documentsQuery.data ?? [];
    let rows = list;
    if (statusFilter) rows = rows.filter((d) => d.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (d) =>
          d.filename.toLowerCase().includes(q) ||
          (d.contentType ?? '').toLowerCase().includes(q) ||
          (d.metadata?.category ?? '').toString().toLowerCase().includes(q),
      );
    }
    return rows;
  }, [documentsQuery.data, search, statusFilter]);

  const processMutation = useMutation({
    mutationFn: (id: string) => documentsService.processDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const handleFile = async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const created = await documentsService.uploadDocument(file.name, file.type || 'application/octet-stream', file.size);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelected(created);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const runAnalysis = async (id: string, action: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await documentsService.analyzeDocument(id, action);
      setAnalysis(result);
    } catch (err) {
      setAnalysis({
        documentId: id,
        action,
        result: `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        provider: 'client',
        model: 'none',
        analyzedAt: new Date().toISOString(),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (documentsQuery.isError) {
    return (
      <ErrorState
        title="Failed to load documents"
        message="Could not reach the document API."
        onRetry={() => documentsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Central document repository for compliance evidence, records, and AI analysis.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {uploadError && (
        <Card className="border-[rgb(var(--danger))] p-3 text-sm text-[rgb(var(--danger))]">{uploadError}</Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input
            placeholder="Search documents…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="processed">Processed</option>
        </select>
      </div>

      <Card className="p-6">
        {documentsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search || statusFilter ? (
            <NoResults query={search} />
          ) : (
            <EmptyState
              icon={<FolderOpen className="h-10 w-10" />}
              title="No documents yet"
              description="Upload compliance documents, evidence, and reports to build your document repository."
              action={<Button onClick={() => fileRef.current?.click()}>Upload Document</Button>}
            />
          )
        ) : (
          <ul className="divide-y divide-[rgb(var(--border-color))]">
            {filtered.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    const doc = documentsQuery.data?.find((x) => x.id === d.id) ?? d;
                    setSelected(doc);
                    setAnalysis(null);
                  }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--panel-2))]">
                    <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.filename}</p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {d.contentType} · {formatBytes(d.sizeBytes)} · {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[d.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {d.status}
                  </span>
                  {d.status === 'uploaded' && (
                    <Button variant="ghost" size="sm" onClick={() => processMutation.mutate(d.id)} title="Process">
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const doc = documentsQuery.data?.find((x) => x.id === d.id) ?? d;
                      setSelected(doc);
                      setAnalysis(null);
                    }}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Card className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border-color))] p-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{selected.filename}</h2>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {selected.contentType} · {formatBytes(selected.sizeBytes)} · {selected.status}
                  {selected.uploadedBy ? ` · Uploaded by ${selected.uploadedBy}` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  setAnalysis(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selected.status === 'uploaded' && (
              <div className="border-b border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[rgb(var(--muted))]">Process this document to extract content and enable AI analysis.</p>
                  <Button size="sm" onClick={() => processMutation.mutate(selected.id)} disabled={processMutation.isPending}>
                    <Zap className="h-4 w-4" /> Process Document
                  </Button>
                </div>
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Extracted Content</h3>
                {selected.status === 'processed' && selected.extractedText ? (
                  <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4 text-xs text-[rgb(var(--text))]">
                    {selected.extractedText}
                  </pre>
                ) : (
                  <p className="rounded-md border border-dashed border-[rgb(var(--border-color))] p-4 text-sm text-[rgb(var(--muted))]">
                    No extracted content available yet. Process the document first.
                  </p>
                )}
              </div>

              {selected.status === 'processed' && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-[rgb(var(--primary))]" />
                    AI Analysis
                  </h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {DOCUMENT_ACTIONS.map((a) => (
                      <Button
                        key={a.value}
                        variant="outline"
                        size="sm"
                        onClick={() => runAnalysis(selected.id, a.value)}
                        disabled={analyzing}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                  {analyzing ? (
                    <Skeleton className="h-32 w-full" />
                  ) : analysis ? (
                    <div>
                      <p className="mb-1 text-xs text-[rgb(var(--muted))]">
                        {analysis.action.replace(/_/g, ' ')} · {new Date(analysis.analyzedAt).toLocaleString()}
                      </p>
                      <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4 text-xs text-[rgb(var(--text))]">
                        {analysis.result}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-[rgb(var(--muted))]">
                      Select an action to analyze this document with AI.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-[rgb(var(--border-color))] p-4">
              <Button variant="outline" onClick={() => { setSelected(null); setAnalysis(null); }}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

