'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Trash2, FileText, FileSpreadsheet, File as FilePdf,
  Download, Eye, Clock, User, Calendar, AlertTriangle, CheckCircle,
  BarChart3, MessageSquare,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { useChat } from '@/modules/ai/hooks.js';

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const chatMutation = useChat();

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ['sustainability', 'report', id],
    queryFn: () => sustainabilityService.getReport(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sustainabilityService.deleteReport(id),
    onSuccess: () => {
      toast({ title: 'Report deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'reports'] });
      router.push('/sustainability/reports');
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const exportMutation = useMutation({
    mutationFn: (format: string) => {
      return sustainabilityService.updateReport(id, { format, status: 'generated' });
    },
    onSuccess: () => {
      toast({ title: 'Report exported', description: 'The report has been generated for download.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'report', id] });
    },
    onError: (err: Error) => toast({ title: 'Export failed', description: err.message, variant: 'error' }),
  });

  const askAi = async () => {
    if (!aiMessage.trim()) return;
    setAiResponse('');
    try {
      const result = await chatMutation.mutateAsync({
        conversationId: `sustainability-report-${id}`,
        message: `Regarding the sustainability report "${report?.name}" (${report?.reportType}): ${aiMessage}`,
        useRag: true,
        systemPrompt: 'You are a sustainability AI copilot. Analyze the report data and provide insights, summaries, and recommendations.',
      });
      setAiResponse(result.text);
    } catch { setAiResponse('Failed to get AI response.'); }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (isError || !report) return <ErrorState title="Report not found" onRetry={() => refetch()} />;

  const FormatIcon = report.format === 'xlsx' ? FileSpreadsheet : report.format === 'docx' ? FileText : FilePdf;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sustainability/reports"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{report.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${
                report.status === 'generated' ? 'bg-green-100 text-green-800' :
                report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>{report.status}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{report.reportType?.replace(/_/g, ' ')} · {report.format?.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAiDialog(true)}>
            <MessageSquare className="mr-1 h-3 w-3" />AI
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-1 h-3 w-3" />Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))] mb-1">
            <FormatIcon className="h-4 w-4" /> Format
          </div>
          <p className="text-lg font-semibold">{report.format?.toUpperCase()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))] mb-1">
            <FileText className="h-4 w-4" /> Type
          </div>
          <p className="text-lg font-semibold">{report.reportType?.replace(/_/g, ' ')}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))] mb-1">
            <User className="h-4 w-4" /> Generated By
          </div>
          <p className="text-lg font-semibold">{report.generatedBy || 'System'}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Report Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">Report Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Description</p>
                <p className="mt-1 text-sm">{report.description || 'No description.'}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>Updated: {new Date(report.updatedAt).toLocaleDateString()}</span>
                </div>
                {report.programId && (
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-[rgb(var(--muted))]" />
                    <span>Linked to Program</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Summary */}
          {report.summary && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Summary</h2>
              <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
            </Card>
          )}

          {/* Report Parameters */}
          {report.params && Object.keys(report.params).length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Report Parameters</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(report.params).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-[rgb(var(--border-color))] p-3">
                    <p className="text-xs text-[rgb(var(--muted))] uppercase">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="mt-1 text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Export Actions */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Export</h2>
            <div className="space-y-2">
              <Button className="w-full" variant="outline" size="sm" onClick={() => exportMutation.mutate('pdf')}
                disabled={exportMutation.isPending}>
                <FilePdf className="mr-2 h-4 w-4" /> Export as PDF
              </Button>
              <Button className="w-full" variant="outline" size="sm" onClick={() => exportMutation.mutate('xlsx')}
                disabled={exportMutation.isPending}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
              </Button>
              <Button className="w-full" variant="outline" size="sm" onClick={() => exportMutation.mutate('docx')}
                disabled={exportMutation.isPending}>
                <FileText className="mr-2 h-4 w-4" /> Export as Word
              </Button>
            </div>
          </Card>

          {/* AI Copilot */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">AI Sustainability Copilot</h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {['Summarize report', 'Highlight key findings', 'Generate executive summary', 'Suggest improvements'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setAiMessage(prompt)}
                    className="rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] transition-colors"
                  >{prompt}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask about this report..." value={aiMessage} onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAi()} />
                <Button size="sm" onClick={askAi} disabled={chatMutation.isPending || !aiMessage.trim()}>
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
              {aiResponse && <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm"><p>{aiResponse}</p></div>}
            </div>
          </Card>

          {/* Download */}
          {report.fileUrl && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Download</h2>
              <Button className="w-full" asChild>
                <Link href={report.fileUrl} target="_blank">
                  <Download className="mr-2 h-4 w-4" /> Download Report
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Report" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{report.name}"?</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

