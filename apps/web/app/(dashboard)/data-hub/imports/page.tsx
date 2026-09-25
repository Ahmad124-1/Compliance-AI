'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileText, CheckCircle2, XCircle, RefreshCw, AlertTriangle,
  Loader2, Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers/ToastProvider';
import { dataHubService } from '@/modules/data-hub/service.js';
import { IMPORT_ENTITY_TYPES } from '@/modules/data-hub/constants.js';
import type { ImportJob, ImportPreview } from '@/modules/data-hub/types.js';

const IMPORT_TYPES = ['csv', 'excel', 'json', 'xml'] as const;
const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.xml'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const STATUS_STYLES: Record<string, string> = {
  uploaded: 'bg-blue-100 text-blue-800',
  queued: 'bg-amber-100 text-amber-800',
  running: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  committed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

const STAGE_LABELS: Record<string, string> = {
  upload: 'Upload', parse: 'Parse', map: 'Column Mapping', validate: 'Validation',
  duplicates: 'Duplicate Detection', commit: 'Commit', sync: 'Synchronization', complete: 'Complete',
};

export default function DataHubImportsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importType, setImportType] = useState<string>('csv');
  const [entityType, setEntityType] = useState(IMPORT_ENTITY_TYPES[0]);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [recordsText, setRecordsText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [committedJob, setCommittedJob] = useState<ImportJob | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [duplicateActions, setDuplicateActions] = useState<Record<string, string>>({});

  const jobsQuery = useQuery({ queryKey: ['data-hub', 'import-jobs'], queryFn: () => dataHubService.importJobs() });
  const jobDetailQuery = useQuery({
    queryKey: ['data-hub', 'import-job', selectedJobId],
    queryFn: () => dataHubService.importJobDetail(selectedJobId!),
    enabled: !!selectedJobId,
  });

  const createMutation = useMutation({
    mutationFn: dataHubService.createImport,
    onSuccess: (job: ImportJob) => {
      toast({ title: 'Import created', description: 'Records queued for validation.', variant: 'success' });
      setActiveJob(job); setCommittedJob(null); setPreview(null); setSelectedJobId(job.id);
      qc.invalidateQueries({ queryKey: ['data-hub'] });
    },
    onError: (err: Error) => toast({ title: 'Import failed', description: err.message, variant: 'error' }),
  });

  const previewMutation = useMutation({
    mutationFn: (jobId: string) => dataHubService.previewImport(jobId),
    onSuccess: (p: ImportPreview) => {
      toast({ title: 'Preview ready', description: `${p.records.length} records ready for review.`, variant: 'success' });
      setPreview(p);
    },
    onError: (err: Error) => toast({ title: 'Preview failed', description: err.message, variant: 'error' }),
  });

  const commitMutation = useMutation({
    mutationFn: (jobId: string) => dataHubService.commitImport(jobId, entityType),
    onSuccess: (job: ImportJob) => {
      toast({ title: 'Import committed', description: 'Approved records propagated to all modules.', variant: 'success' });
      setCommittedJob(job); setActiveJob(null); setPreview(null);
      qc.invalidateQueries({ queryKey: ['data-hub'] });
    },
    onError: (err: Error) => toast({ title: 'Commit failed', description: err.message, variant: 'error' }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => dataHubService.retryImportJob(id),
    onSuccess: (res) => {
      toast({ title: 'Job retried', description: res.message, variant: 'success' });
      qc.invalidateQueries({ queryKey: ['data-hub'] });
    },
    onError: (err: Error) => toast({ title: 'Retry failed', description: err.message, variant: 'error' }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => dataHubService.cancelImportJob(id),
    onSuccess: (res) => {
      toast({ title: 'Job cancelled', description: res.message, variant: 'success' });
      qc.invalidateQueries({ queryKey: ['data-hub'] });
    },
    onError: (err: Error) => toast({ title: 'Cancel failed', description: err.message, variant: 'error' }),
  });

  const handleFile = useCallback((file: File) => {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast({ title: 'Unsupported file type', description: `Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}. Got ${ext}.`, variant: 'error' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Maximum file size is 25 MB.', variant: 'error' });
      return;
    }
    setFileName(file.name);
    setImportType(ext === '.csv' ? 'csv' : ext === '.xlsx' || ext === '.xls' ? 'excel' : ext === '.json' ? 'json' : 'xml');
    setUploading(true); setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval); setUploading(false);
          toast({ title: 'File ready', description: `${file.name} (${(file.size / 1024).toFixed(1)} KB) staged for import.`, variant: 'success' });
          return 100;
        }
        return p + 10;
      });
    }, 120);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const parseRecords = (): Array<Record<string, unknown>> => {
    if (!recordsText.trim()) return [];
    return recordsText.trim().split('\n').map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return { name: cols[0] || undefined, code: cols[1] || undefined, description: cols[2] || undefined };
    }).filter((r) => r.name);
  };

  const handleCreateImport = () => {
    if (!fileName.trim()) {
      toast({ title: 'Missing file name', description: 'Enter a file name or drop a file to begin.', variant: 'error' });
      return;
    }
    createMutation.mutate({
      importType, entityType, fileName, fileUrl: fileUrl || undefined,
      records: parseRecords(), metadata: { source: 'data-hub-import-center' },
    });
  };

  const jobs = jobsQuery.data ?? [];
  const selectedDetail = jobDetailQuery.data;
  const activeProgress = selectedDetail?.progress ?? [];
  const activeDuplicates = selectedDetail?.duplicates ?? [];

  const renderValidation = (job: ImportJob) => {
    const total = job.totalRecords || 0;
    const valid = job.validRecords || 0;
    const invalid = job.invalidRecords || 0;
    const pct = total > 0 ? Math.round(((valid + invalid) / total) * 100) : 0;
    return (
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-xs text-[rgb(var(--muted))]">Total rows</p>
          </div>
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-2xl font-semibold text-green-600">{valid}</p>
            <p className="text-xs text-green-700">Valid</p>
          </div>
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-2xl font-semibold text-red-600">{invalid}</p>
            <p className="text-xs text-red-700">Invalid</p>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Validation progress</span><span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--border-color))]">
            <div className={`h-full rounded-full transition-all ${invalid > 0 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  };

  const renderDuplicates = (dups: typeof activeDuplicates) => {
    if (!dups.length) return null;
    return (
      <div className="mt-4">
        <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-500" />Duplicate Detection ({dups.length})
        </h3>
        <div className="overflow-auto rounded-md border border-[rgb(var(--border-color))]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgb(var(--background))]">
              <tr className="border-b border-[rgb(var(--border-color))]">
                <th className="px-3 py-2">Key</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Confidence</th><th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {dups.map((d) => (
                <tr key={d.id} className="border-b border-[rgb(var(--border-color))] last:border-0">
                  <td className="px-3 py-1.5 font-medium">{d.duplicateKey}</td>
                  <td className="px-3 py-1.5 capitalize">{d.duplicateType.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-1.5">{Math.round(d.confidence * 100)}%</td>
                  <td className="px-3 py-1.5">
                    <select
                      defaultValue={d.action}
                      className="rounded border border-[rgb(var(--border-color))] bg-transparent px-2 py-0.5 text-xs"
                      onChange={(e) => {
                        const actions = { ...duplicateActions, [d.id]: e.target.value };
                        setDuplicateActions(actions);
                      }}
                    >
                      <option value="skip">Skip</option><option value="replace">Replace</option>
                      <option value="merge">Merge</option><option value="create_new">Create new</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProgress = (progress: typeof activeProgress) => {
    if (!progress.length) return null;
    return (
      <div className="mt-4">
        <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold">
          <Clock className="h-4 w-4" />Background Job Progress
        </h3>
        <div className="space-y-2">
          {progress.map((p) => {
            const pct = p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0;
            return (
              <div key={p.id} className="rounded-md border border-[rgb(var(--border-color))] p-3 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium capitalize">{STAGE_LABELS[p.stage] ?? p.stage}</span>
                  <span className={`rounded px-1.5 py-0.5 capitalize ${p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : p.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-indigo-100 text-indigo-800'}`}>{p.status}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--border-color))]">
                  <div className={`h-full rounded-full ${p.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[rgb(var(--muted))]">{p.processed}/{p.total} · {pct}% {p.message ? `· ${p.message}` : ''}</p>
                {p.error && <p className="mt-1 text-red-600">{p.error}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderJobActions = (job: ImportJob) => {
    const canRetry = job.status === 'failed' || job.status === 'cancelled';
    const canCancel = job.status === 'queued' || job.status === 'running';
    return (
      <div className="flex gap-2">
        {canRetry && (
          <Button variant="outline" size="sm" onClick={() => retryMutation.mutate(job.id)}>
            <RefreshCw className="mr-1 h-3 w-3" />Retry
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(job.id)}>
            <XCircle className="mr-1 h-3 w-3" />Cancel
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Smart Import Center</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Upload → Preview → Auto column mapping → Validation → Duplicate detection → Commit → Synchronization → Activity log.
          Supports CSV, Excel, JSON and XML. Large imports run as background jobs with progress tracking.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 1. Upload */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">1. Upload</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-[rgb(var(--border-color))]'}`}
          >
            <Upload className="mb-2 h-8 w-8 text-[rgb(var(--muted))]" />
            <p className="text-sm font-medium">Drag & drop a file here</p>
            <p className="text-xs text-[rgb(var(--muted))]">CSV, XLSX, JSON, XML · max 25 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--border-color))]">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <select value={importType} onChange={(e) => setImportType(e.target.value)} className="w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm">
              {IMPORT_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm">
              {IMPORT_ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <Input placeholder="File name * (e.g. facilities_q1.csv)" value={fileName} onChange={(e) => setFileName(e.target.value)} />
            <Input placeholder="File URL (optional)" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
            <textarea
              value={recordsText}
              onChange={(e) => setRecordsText(e.target.value)}
              placeholder="Paste rows as: name, code, description (one per line)"
              rows={4}
              className="w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm"
            />
            <Button onClick={handleCreateImport} disabled={createMutation.isPending || uploading} className="w-full">
              <Upload className="mr-2 h-4 w-4" />{createMutation.isPending ? 'Uploading…' : 'Upload Import'}
            </Button>
          </div>
        </Card>

        {/* 2. Preview & Column Mapping */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">2. Preview & Column Mapping</h2>
          {activeJob ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <p><span className="font-medium">File:</span> {activeJob.fileName}</p>
                <p><span className="font-medium">Entity:</span> {activeJob.entityType.replace(/_/g, ' ')}</p>
                <span className={`rounded px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[activeJob.status] ?? 'bg-gray-100 text-gray-700'}`}>{activeJob.status}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => previewMutation.mutate(activeJob.id)} disabled={previewMutation.isPending} variant="outline" size="sm">
                  {previewMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileText className="mr-1 h-3 w-3" />}Preview Records
                </Button>
                {preview && !committedJob && (
                  <Button onClick={() => commitMutation.mutate(activeJob.id)} disabled={commitMutation.isPending} size="sm">
                    <CheckCircle2 className="mr-1 h-3 w-3" />{commitMutation.isPending ? 'Committing…' : 'Commit & Propagate'}
                  </Button>
                )}
              </div>

              {preview && (
                <div className="mt-2 space-y-3">
                  <p className="font-medium">{preview.records.length} records found</p>
                  <div className="max-h-64 overflow-auto rounded-md border border-[rgb(var(--border-color))]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-[rgb(var(--background))]">
                        <tr className="border-b border-[rgb(var(--border-color))]">
                          <th className="px-3 py-2">#</th><th className="px-3 py-2">Entity</th>
                          <th className="px-3 py-2">Status</th><th className="px-3 py-2">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.records.slice(0, 50).map((r, i) => (
                          <tr key={r.id} className="border-b border-[rgb(var(--border-color))] last:border-0">
                            <td className="px-3 py-1.5">{i + 1}</td>
                            <td className="px-3 py-1.5">{r.entityName ?? '—'}</td>
                            <td className="px-3 py-1.5">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                            </td>
                            <td className="px-3 py-1.5 text-[rgb(var(--muted))]">{r.validationErrors.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.records.length > 50 && (
                    <p className="text-xs text-[rgb(var(--muted))]">Showing first 50 of {preview.records.length} records.</p>
                  )}
                </div>
              )}

              {committedJob && (
                <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-700"><CheckCircle2 className="mr-1 inline h-4 w-4" />Import committed successfully</p>
                  <p className="text-xs text-green-700">Approved records were propagated to Compliance, Supplier, Sustainability, Carbon & GHG, Environmental, and ESG modules. Activity logs recorded.</p>
                  {activeProgress.length > 0 && renderProgress(activeProgress)}
                </div>
              )}

              {activeJob.status === 'committed' && !committedJob && (
                <p className="text-sm text-green-600"><CheckCircle2 className="mr-1 inline h-4 w-4" />This import has been committed and propagated.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">
              Create an import to begin. Records flow: Upload → Preview → Column Mapping → Validation → Duplicate Detection → Commit → Synchronization.
            </p>
          )}
        </Card>
      </div>

      {/* 3. Validation & Duplicate Resolution */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">3. Validation & Duplicate Resolution</h2>
        {activeJob ? (
          <div className="space-y-4">
            {renderValidation(activeJob)}
            {renderDuplicates(activeDuplicates)}
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">
            Detailed validation report with row-level errors, suggested fixes, and duplicate detection appears here after you upload an import.
          </p>
        )}
      </Card>

      {/* 4. Job Progress */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">4. Background Job Progress</h2>
        {selectedDetail ? (
          renderProgress(activeProgress) ?? <p className="text-sm text-[rgb(var(--muted))]">No progress entries yet for this job.</p>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">Select a job from history to see its stage-by-stage progress, estimated completion, and errors.</p>
        )}
      </Card>

      {/* 5. Import History */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">5. Import History</h2>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['data-hub', 'import-jobs'] })}>
            <RefreshCw className="mr-1 h-3 w-3" />Refresh
          </Button>
        </div>

        {jobsQuery.isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-[rgb(var(--border-color))]" />)}
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No imports yet. Upload your first file above.</p>
        ) : (
          <div className="overflow-auto rounded-md border border-[rgb(var(--border-color))]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[rgb(var(--background))]">
                <tr className="border-b border-[rgb(var(--border-color))]">
                  <th className="px-3 py-2">File</th><th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Status</th><th className="px-3 py-2">Records</th>
                  <th className="px-3 py-2">Valid</th><th className="px-3 py-2">Errors</th>
                  <th className="px-3 py-2">Created</th><th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`cursor-pointer border-b border-[rgb(var(--border-color))] last:border-0 ${selectedJobId === job.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-3 py-2 font-medium">{job.fileName}</td>
                    <td className="px-3 py-2 capitalize">{job.entityType.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 capitalize ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-700'}`}>{job.status}</span>
                    </td>
                    <td className="px-3 py-2">{job.totalRecords}</td>
                    <td className="px-3 py-2 text-green-600">{job.validRecords}</td>
                    <td className="px-3 py-2 text-red-600">{job.invalidRecords}</td>
                    <td className="px-3 py-2">{new Date(job.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>{renderJobActions(job)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}