'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { FileText, Upload, ExternalLink, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/providers/ToastProvider';
import { dataHubService } from '@/modules/data-hub/service.js';
import { HUB_DOCUMENT_CATEGORIES } from '@/modules/data-hub/constants.js';

export default function DataHubDocumentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [docCategory, setDocCategory] = useState('Certificate');

  const docsQuery = useQuery({
    queryKey: ['data-hub', 'documents', category],
    queryFn: () => dataHubService.getDocuments(category || undefined),
  });

  const createMutation = useMutation({
    mutationFn: dataHubService.createDocument,
    onSuccess: () => {
      toast({ title: 'Document uploaded', description: 'Document is now reusable across all modules.', variant: 'success' });
      setTitle('');
      setFileUrl('');
      setFileName('');
      setFileType('');
      qc.invalidateQueries({ queryKey: ['data-hub', 'documents'] });
      qc.invalidateQueries({ queryKey: ['data-hub', 'dashboard'] });
    },
    onError: () => toast({ title: 'Upload failed', description: 'Failed to upload document.', variant: 'error' }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Document Center</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Centralized document repository — PDFs, Word, Excel, CSV, images, certificates, policies, invoices, utility bills, audit reports, training records, supplier documents, environmental and carbon reports. Every document is reusable by multiple modules.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Upload Document</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Document title *" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="File URL * (e.g. /uploads/utility-bill.pdf)" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
          <Input placeholder="File name (optional)" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          <Input placeholder="File type (optional, e.g. application/pdf)" value={fileType} onChange={(e) => setFileType(e.target.value)} />
          <select
            value={docCategory}
            onChange={(e) => setDocCategory(e.target.value)}
            className="rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm"
          >
            {HUB_DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mt-3">
          <Button onClick={() => createMutation.mutate({ title, category: docCategory, fileUrl, fileName: fileName || undefined, fileType: fileType || undefined })} disabled={!title || !fileUrl || createMutation.isPending}>
            <Upload className="mr-2 h-4 w-4" />{createMutation.isPending ? 'Uploading…' : 'Upload Document'}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${!category ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}
        >
          All
        </button>
        {HUB_DOCUMENT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${category === c ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {docsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : docsQuery.isError ? (
        <ErrorState title="Failed to load documents" onRetry={() => docsQuery.refetch()} />
      ) : docsQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {docsQuery.data.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between">
                <FileText className="h-5 w-5 text-[rgb(var(--primary))]" />
                <span className="rounded bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">{doc.category}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{doc.title}</h3>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]}">{doc.fileName || doc.fileUrl}</p>
              <p className="text-xs text-[rgb(var(--muted))]">Linked to {doc.linkCount} module(s)</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3 w-3" />View</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-[rgb(var(--muted))]">No documents yet. Upload your first document to the Data Hub and it becomes reusable across Sustainability, Carbon & GHG, ESG, Compliance and Supplier modules.</p>
        </Card>
      )}
    </div>
  );
}