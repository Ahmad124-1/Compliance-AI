'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { useCase, useUpdateCase, useDeleteCase, useAddComment, useAddNote, useAddResponse, useAddEvidence, useAddWitness, useAddInterview, useAddFinding, useAddRootCause, useAddResolution, useCreateInvestigation, useGetInvestigation, useCalculateRisk } from '@/modules/cases/module.store.js';
import { CASE_STATUS_LABELS, CASE_PRIORITY_LABELS, CASE_SEVERITY_LABELS } from '@/modules/cases/module.constants.js';

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: case_, refetch } = useCase(id);
  const update = useUpdateCase();
  const remove = useDeleteCase();
  const addComment = useAddComment();
  const addNote = useAddNote();
  const addResponse = useAddResponse();
  const addEvidence = useAddEvidence();
  const addWitness = useAddWitness();
  const addInterview = useAddInterview();
  const addFinding = useAddFinding();
  const addRootCause = useAddRootCause();
  const addResolution = useAddResolution();

  const [tab, setTab] = useState<'overview' | 'activity' | 'comments' | 'notes' | 'responses' | 'evidence' | 'witnesses' | 'interviews' | 'findings' | 'root_causes' | 'resolutions' | 'investigation' | 'escalation' | 'risk'>('overview');

  const createInvestigation = useCreateInvestigation() as any;
  const investigation = useGetInvestigation(id);
  const riskHook = useCalculateRisk() as any;

  const handleStartInvestigation = () => {
    createInvestigation.mutate({ caseId: id, dto: {} }, { onSuccess: refetch });
  };

  const handleCalculateRisk = () => {
    riskHook.mutate(id, { onSuccess: refetch });
  };


  const [commentBody, setCommentBody] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [responseBody, setResponseBody] = useState('');
  const [evidenceFilename, setEvidenceFilename] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [interviewSummary, setInterviewSummary] = useState('');
  const [findingTitle, setFindingTitle] = useState('');
  const [rootCauseDesc, setRootCauseDesc] = useState('');
  const [resolutionDesc, setResolutionDesc] = useState('');

  if (!case_) return <div className="p-6">Loading...</div>;

  const handleUpdateStatus = () => {
    update.mutate({ id, patch: { status: case_.status, priority: case_.priority, severity: case_.severity } });
    refetch();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <a href="/admin/cases" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]">Back to Cases</a>
        <h1 className="text-2xl font-semibold">Case {case_.caseNumber}</h1>
      </div>

      <div className="mb-4 flex items-center gap-2 border-b border-[rgb(var(--border-color))] overflow-x-auto">
        {[
          ['overview', 'Overview'],
          ['activity', 'Activity'],
          ['comments', 'Comments'],
          ['notes', 'Internal Notes'],
          ['responses', 'Public Responses'],
          ['evidence', 'Evidence'],
          ['witnesses', 'Witnesses'],
          ['interviews', 'Interviews'],
          ['findings', 'Findings'],
          ['root_causes', 'Root Causes'],
          ['resolutions', 'Resolutions'],
          ['investigation', 'Investigation'],
          ['escalation', 'Escalation'],
          ['risk', 'Risk'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`whitespace-nowrap px-3 py-2 text-sm capitalize ${tab === key ? 'border-b-2 border-[rgb(var(--primary))] text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]'}`}>
            {label}
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
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Source</p>
              <p className="font-medium">{case_.source}</p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Reporter</p>
              <p className="font-medium">{case_.reporterName ?? 'Anonymous'}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[rgb(var(--muted))]">Title</p>
            <p className="text-sm font-medium">{case_.title}</p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[rgb(var(--muted))]">Description</p>
            <p className="text-sm text-[rgb(var(--muted))]">{case_.description}</p>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={case_.status} onChange={(e) => { update.mutate({ id, patch: { ...case_, status: e.target.value as any } }); refetch(); }}>
                {Object.entries(CASE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Priority</p>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={case_.priority} onChange={(e) => { update.mutate({ id, patch: { ...case_, priority: e.target.value as any } }); refetch(); }}>
                {Object.entries(CASE_PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Severity</p>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={case_.severity} onChange={(e) => { update.mutate({ id, patch: { ...case_, severity: e.target.value as any } }); refetch(); }}>
                {Object.entries(CASE_SEVERITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpdateStatus}>Save Changes</Button>
            <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this case?')) { remove.mutate(id); } }}>Delete</Button>
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

      {tab === 'comments' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Comments</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add a comment..." />
            <Button size="sm" onClick={() => { if (commentBody.trim()) { addComment.mutate({ id, dto: { body: commentBody } }, { onSuccess: () => { refetch(); setCommentBody(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.comments?.map((c: any) => (
              <div key={c.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm font-medium">{c.body}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{c.isInternal ? 'Internal' : 'Public'} · {new Date(c.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!case_.comments?.length && <p className="text-sm text-[rgb(var(--muted))]">No comments yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'notes' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Internal Notes</h3>
          <div className="flex gap-2 mb-4">
            <input className="h-9 w-48 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" />
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Note body" />
            <Button size="sm" onClick={() => { if (noteTitle.trim() && noteBody.trim()) { addNote.mutate({ id, dto: { title: noteTitle, body: noteBody } }, { onSuccess: () => { refetch(); setNoteTitle(''); setNoteBody(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.notes?.map((n: any) => (
              <div key={n.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{n.body}</p>
              </div>
            ))}
            {!case_.notes?.length && <p className="text-sm text-[rgb(var(--muted))]">No notes yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'responses' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Public Responses</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={responseBody} onChange={(e) => setResponseBody(e.target.value)} placeholder="Public response..." />
            <Button size="sm" onClick={() => { if (responseBody.trim()) { addResponse.mutate({ id, dto: { body: responseBody } }, { onSuccess: () => { refetch(); setResponseBody(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.responses?.map((r: any) => (
              <div key={r.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm">{r.body}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!case_.responses?.length && <p className="text-sm text-[rgb(var(--muted))]">No responses yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'evidence' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Evidence</h3>
          <div className="flex gap-2 mb-4">
            <input className="h-9 w-48 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={evidenceFilename} onChange={(e) => setEvidenceFilename(e.target.value)} placeholder="Filename" />
            <Button size="sm" onClick={() => { if (evidenceFilename.trim()) { addEvidence.mutate({ id, dto: { filename: evidenceFilename, originalFilename: evidenceFilename, mimeType: 'application/octet-stream', sizeBytes: 0, storagePath: '', category: 'document' } }, { onSuccess: () => { refetch(); setEvidenceFilename(''); } }); } }}>Add</Button>
          </div>
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

      {tab === 'witnesses' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Witnesses</h3>
          <div className="flex gap-2 mb-4">
            <input className="h-9 w-48 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={witnessName} onChange={(e) => setWitnessName(e.target.value)} placeholder="Witness name" />
            <Button size="sm" onClick={() => { if (witnessName.trim()) { addWitness.mutate({ id, dto: { fullName: witnessName, email: null, phone: null, role: 'witness' } }, { onSuccess: () => { refetch(); setWitnessName(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.witnesses?.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-2">
                <div>
                  <p className="text-sm font-medium">{w.fullName}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{w.role ?? 'Unknown'} · {w.isAnonymous ? 'Anonymous' : w.email}</p>
                </div>
              </div>
            ))}
            {!case_.witnesses?.length && <p className="text-sm text-[rgb(var(--muted))]">No witnesses yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'interviews' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Interviews</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={interviewSummary} onChange={(e) => setInterviewSummary(e.target.value)} placeholder="Interview summary" />
            <Button size="sm" onClick={() => { if (interviewSummary.trim()) { addInterview.mutate({ id, dto: { summary: interviewSummary, type: 'verbal', isConfidential: true } }, { onSuccess: () => { refetch(); setInterviewSummary(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.interviews?.map((i: any) => (
              <div key={i.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm font-medium">{i.type} · {i.summary}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{new Date(i.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!case_.interviews?.length && <p className="text-sm text-[rgb(var(--muted))]">No interviews yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'findings' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Findings</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={findingTitle} onChange={(e) => setFindingTitle(e.target.value)} placeholder="Finding title" />
            <Button size="sm" onClick={() => { if (findingTitle.trim()) { addFinding.mutate({ id, dto: { title: findingTitle, description: findingTitle, severity: 'medium', confidence: 'medium' } }, { onSuccess: () => { refetch(); setFindingTitle(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.findings?.map((f: any) => (
              <div key={f.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{f.severity} · {f.confidence}</p>
              </div>
            ))}
            {!case_.findings?.length && <p className="text-sm text-[rgb(var(--muted))]">No findings yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'root_causes' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Root Causes</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={rootCauseDesc} onChange={(e) => setRootCauseDesc(e.target.value)} placeholder="Root cause description" />
            <Button size="sm" onClick={() => { if (rootCauseDesc.trim()) { addRootCause.mutate({ id, dto: { category: 'process', description: rootCauseDesc } }, { onSuccess: () => { refetch(); setRootCauseDesc(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.rootCauses?.map((r: any) => (
              <div key={r.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm font-medium">{r.category}: {r.description}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{r.verified ? 'Verified' : 'Unverified'}</p>
              </div>
            ))}
            {!case_.rootCauses?.length && <p className="text-sm text-[rgb(var(--muted))]">No root causes yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'resolutions' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Resolutions</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={resolutionDesc} onChange={(e) => setResolutionDesc(e.target.value)} placeholder="Resolution description" />
            <Button size="sm" onClick={() => { if (resolutionDesc.trim()) { addResolution.mutate({ id, dto: { type: 'corrective', description: resolutionDesc, actionsTaken: resolutionDesc } }, { onSuccess: () => { refetch(); setResolutionDesc(''); } }); } }}>Add</Button>
          </div>
          <div className="space-y-2">
            {case_.resolutions?.map((r: any) => (
              <div key={r.id} className="border-b border-[rgb(var(--border-color))] pb-2">
                <p className="text-sm font-medium">{r.type}: {r.description}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{r.isFinal ? 'Final' : 'Draft'}</p>
              </div>
            ))}
            {!case_.resolutions?.length && <p className="text-sm text-[rgb(var(--muted))]">No resolutions yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'investigation' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Investigation</h3>
          {investigation.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[rgb(var(--muted))]">Status</p>
                  <p className="text-sm font-medium">{investigation.data.status}</p>
                </div>
                <div>
                  <p className="text-xs text-[rgb(var(--muted))]">Lead</p>
                  <p className="text-sm font-medium">{investigation.data.leadInvestigator ?? 'Unassigned'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Scope</p>
                <p className="text-sm">{investigation.data.scope ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--muted))]">Conclusion</p>
                <p className="text-sm">{investigation.data.conclusion ?? '—'}</p>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={handleStartInvestigation}>Start Investigation</Button>
          )}
        </Card>
      )}

      {tab === 'escalation' && (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium">Escalation History</h3>
          <div className="space-y-2">
            {(case_ as any).escalationHistory?.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between border-b border-[rgb(var(--border-color))] pb-2">
                <div>
                  <p className="text-sm font-medium">{e.reason}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">To: {e.escalatedTo ?? 'N/A'}</p>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!(case_ as any).escalationHistory?.length && <p className="text-sm text-[rgb(var(--muted))]">No escalations.</p>}
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
            <Button size="sm" onClick={handleCalculateRisk}>Calculate Risk</Button>
          )}
        </Card>
      )}
    </div>
  );
}
