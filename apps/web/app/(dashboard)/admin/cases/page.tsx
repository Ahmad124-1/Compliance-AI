'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { useCases, useCaseStats, useDeleteCase, useRestoreCase, useUpdateCase } from '@/modules/cases/module.store.js';
import { CASE_STATUS_LABELS, CASE_PRIORITY_LABELS, CASE_SEVERITY_LABELS } from '@/modules/cases/module.constants.js';
import Link from 'next/link';

export default function AdminCasesPage() {
  const { data: cases, refetch } = useCases();
  const { data: stats } = useCaseStats();
  const deleteCase = useDeleteCase();
  const restoreCase = useRestoreCase();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = cases?.cases?.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} cases?`)) return;
    await Promise.all([...selectedIds].map((id) => deleteCase.mutateAsync(id)));
    setSelectedIds(new Set());
    refetch();
  };

  const handleBulkRestore = async () => {
    if (!confirm(`Restore ${selectedIds.size} cases?`)) return;
    await Promise.all([...selectedIds].map((id) => restoreCase.mutateAsync(id)));
    setSelectedIds(new Set());
    refetch();
  };

  if (selectedId) {
    const case_ = cases?.cases?.find((c) => c.id === selectedId);
    if (case_) {
      return <CaseDetail case_={case_} onBack={() => setSelectedId(null)} onUpdate={refetch} />;
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cases</h1>
        <Link href="/admin/cases/create">
          <Button>New Case</Button>
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Total</p>
          <p className="text-xl font-semibold">{stats?.total ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Open</p>
          <p className="text-xl font-semibold">{stats?.byStatus?.open ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Escalated</p>
          <p className="text-xl font-semibold">{stats?.byStatus?.escalated ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Resolved</p>
          <p className="text-xl font-semibold">{stats?.byStatus?.resolved ?? 0}</p>
        </Card>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <select className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(CASE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {selectedIds.size > 0 && (
          <>
            <Button size="sm" variant="outline" onClick={handleBulkRestore}>Restore ({selectedIds.size})</Button>
            <Button size="sm" variant="outline" onClick={handleBulkDelete} className="text-red-600">Delete ({selectedIds.size})</Button>
          </>
        )}
      </div>

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {filtered?.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="h-4 w-4 rounded" />
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {c.caseNumber} · {c.category} · {CASE_STATUS_LABELS[c.status] ?? c.status}
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                {CASE_STATUS_LABELS[c.status] ?? c.status}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(c.priority)}`}>
                {CASE_PRIORITY_LABELS[c.priority] ?? c.priority}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColor(c.severity)}`}>
                {CASE_SEVERITY_LABELS[c.severity] ?? c.severity}
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>
                View
              </Button>
            </div>
          </div>
        ))}
        {filtered?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No cases found.</p>}
      </Card>
    </div>
  );
}

function CaseDetail({ case_, onBack, onUpdate }: { case_: any; onBack: () => void; onUpdate: () => void }) {
  const [tab, setTab] = useState<'overview' | 'activity' | 'evidence' | 'investigation' | 'escalation' | 'risk'>('overview');
  const update = useUpdateCase();
  const [status, setStatus] = useState(case_.status);
  const [priority, setPriority] = useState(case_.priority);
  const [severity, setSeverity] = useState(case_.severity);

  const handleUpdate = async () => {
    await update.mutateAsync({ id: case_.id, patch: { status, priority, severity } });
    onUpdate();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBack}>Back</Button>
        <h1 className="text-2xl font-semibold">Case {case_.caseNumber}</h1>
      </div>

      <div className="mb-4 flex items-center gap-2 border-b border-[rgb(var(--border-color))]">
        {(['overview', 'activity', 'evidence', 'investigation', 'escalation', 'risk'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-[rgb(var(--primary))] text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card className="p-6">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Case Number</p>
              <p className="font-mono font-semibold">{case_.caseNumber}</p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Category</p>
              <p className="font-medium">{case_.category}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Title</p>
            <p className="text-sm text-[rgb(var(--muted))]">{case_.title}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Description</p>
            <p className="text-sm text-[rgb(var(--muted))]">{case_.description}</p>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(CASE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Priority</p>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(CASE_PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Severity</p>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {Object.entries(CASE_SEVERITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
            <Button size="sm" variant="ghost" onClick={onBack}>Cancel</Button>
          </div>
        </Card>
      )}

      {tab === 'activity' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Activity</h3>
          <div className="space-y-2">
            {case_.activities?.map((a: any) => (
              <div key={a.id} className="flex items-start justify-between border-b border-[rgb(var(--border-color))] pb-2">
                <div>
                  <p className="text-sm font-medium">{a.description}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{a.activityType}</p>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!case_.activities?.length && <p className="text-sm text-[rgb(var(--muted))]">No activity yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'evidence' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Evidence</h3>
          <div className="space-y-2">
            {case_.evidence?.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-2">
                <div>
                  <p className="text-sm font-medium">{e.filename}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{e.mimeType} · {(e.sizeBytes / 1024).toFixed(1)} KB</p>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!case_.evidence?.length && <p className="text-sm text-[rgb(var(--muted))]">No evidence uploaded.</p>}
          </div>
        </Card>
      )}

      {tab === 'investigation' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Investigation</h3>
          {case_.investigation ? (
            <div className="space-y-2">
              <p className="text-sm">Status: <span className="font-medium">{case_.investigation.status}</span></p>
              <p className="text-sm text-[rgb(var(--muted))]">{case_.investigation.scope}</p>
              <div className="mt-3">
                <p className="text-xs font-medium mb-1">Timeline</p>
                {case_.investigation.timeline?.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-1">
                    <p className="text-sm">{t.description}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No investigation started.</p>
          )}
        </Card>
      )}

      {tab === 'escalation' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Escalation History</h3>
          <div className="space-y-2">
            {case_.escalationHistory?.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-2">
                <div>
                  <p className="text-sm font-medium">{e.reason}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Escalated to: {e.escalatedTo ?? 'N/A'}</p>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!case_.escalationHistory?.length && <p className="text-sm text-[rgb(var(--muted))]">No escalations.</p>}
          </div>
        </Card>
      )}

      {tab === 'risk' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Risk Score</h3>
          {case_.riskScore ? (
            <div>
              <p className="text-3xl font-bold">{case_.riskScore.overallScore}/100</p>
              <p className="text-xs text-[rgb(var(--muted))]">Method: {case_.riskScore.calculationMethod}</p>
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No risk score calculated.</p>
          )}
        </Card>
      )}
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-700';
    case 'under_investigation': return 'bg-blue-100 text-blue-700';
    case 'escalated': return 'bg-red-100 text-red-700';
    case 'pending_review': return 'bg-yellow-100 text-yellow-700';
    case 'resolved': return 'bg-emerald-100 text-emerald-700';
    case 'closed': return 'bg-gray-100 text-gray-700';
    case 'archived': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-700';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'critical': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function severityColor(severity: string) {
  switch (severity) {
    case 'low': return 'bg-gray-100 text-gray-700';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'critical': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
