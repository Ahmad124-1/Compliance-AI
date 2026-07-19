'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, CheckCircle2, Clock, Users, Paperclip } from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { EmptyState } from '@/components/ui/states.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useAssessment, useResponses, useScores, useAssignments, useReviews, useApprovals, useComments, useAttachments } from '@/modules/assessments/module.store.js';
import { STATUS_LABELS } from '@/modules/assessments/module.constants.js';
import type { AssessmentStatusKey, AssessmentTypeKey } from '@/modules/assessments/module.types.js';
import { ASSESSMENT_TYPE_LABELS } from '@/modules/assessments/module.types.js';

type Tab = 'overview' | 'responses' | 'scores' | 'workflow';

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('assessment:update');

  const { data: assessment, isLoading } = useAssessment(id);
  const { data: responses } = useResponses(id);
  const { data: scores } = useScores(id);
  const { data: assignments } = useAssignments(id);
  const { data: reviews } = useReviews(id);
  const { data: approvals } = useApprovals(id);
  const { data: comments } = useComments(id);
  const { data: attachments } = useAttachments(id);

  const [tab, setTab] = useState<Tab>('overview');

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading assessment…</p>;
  if (!assessment) return <EmptyState title="Assessment not found" description="This assessment may have been removed." />;

  const typeLabel = ASSESSMENT_TYPE_LABELS[assessment.type as AssessmentTypeKey] ?? assessment.type;
  const statusLabel = STATUS_LABELS[assessment.status as AssessmentStatusKey] ?? assessment.status;

  const answered = responses?.filter((r) => !r.isSkipped).length ?? 0;
  const total = responses?.length ?? 0;
  const progressPct = total ? Math.round((answered / total) * 100) : 0;

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: ClipboardList },
    { key: 'responses', label: 'Responses', icon: CheckCircle2, count: answered },
    { key: 'scores', label: 'Scores', icon: Clock, count: scores?.length },
    { key: 'workflow', label: 'Workflow', icon: Users, count: (assignments?.length ?? 0) + (reviews?.length ?? 0) + (approvals?.length ?? 0) + (comments?.length ?? 0) + (attachments?.length ?? 0) },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/assessments"><Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{assessment.title}</h1>
          <p className="text-xs text-[rgb(var(--muted))]">{typeLabel} · {statusLabel} · v{assessment.templateVersion}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled>Edit</Button>
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Progress" value={`${progressPct}%`} />
        <StatCard label="Status" value={statusLabel} />
        <StatCard label="Scope" value={assessment.scope} />
        <StatCard label="Due" value={assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : '—'} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? 'default' : 'outline'} onClick={() => setTab(t.key)}>
            <t.icon className="mr-2 h-4 w-4" />{t.label}{t.count !== undefined ? ` (${t.count})` : ''}
          </Button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Details</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div><dt className="text-xs text-[rgb(var(--muted))]">Code</dt><dd className="text-sm font-medium">{assessment.code ?? '—'}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Type</dt><dd className="text-sm font-medium">{typeLabel}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Status</dt><dd className="text-sm font-medium">{statusLabel}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Template</dt><dd className="text-sm font-medium">{assessment.templateId}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Started</dt><dd className="text-sm font-medium">{assessment.startedAt ? new Date(assessment.startedAt).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Submitted</dt><dd className="text-sm font-medium">{assessment.submittedAt ? new Date(assessment.submittedAt).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Completed</dt><dd className="text-sm font-medium">{assessment.completedAt ? new Date(assessment.completedAt).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Assignee</dt><dd className="text-sm font-medium">{assessment.assigneeId ?? '—'}</dd></div>
            <div><dt className="text-xs text-[rgb(var(--muted))]">Created</dt><dd className="text-sm font-medium">{new Date(assessment.createdAt).toLocaleString()}</dd></div>
          </dl>
        </Card>
      )}

      {tab === 'responses' && (
        <Card className="divide-y divide-[rgb(var(--border-color))]">
          {responses?.length ? responses.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">Question {r.questionId.slice(0, 8)}…</p>
                <p className="text-xs text-[rgb(var(--muted))]">{r.validationStatus} {r.isSkipped ? '· Skipped' : ''} {r.isFlagged ? '· Flagged' : ''}</p>
              </div>
              <span className="text-xs text-[rgb(var(--muted))]">{r.answeredAt ? new Date(r.answeredAt).toLocaleString() : '—'}</span>
            </div>
          )) : <p className="p-4 text-sm text-[rgb(var(--muted))]">No responses yet.</p>}
        </Card>
      )}

      {tab === 'scores' && (
        <Card className="divide-y divide-[rgb(var(--border-color))]">
          {scores?.length ? scores.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{s.method} {s.label ? `· ${s.label}` : ''}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{s.sectionId ? 'Section' : 'Question'} {s.questionId ? s.questionId.slice(0, 8) + '…' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{s.normalizedScore != null ? `${s.normalizedScore}%` : '—'}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{s.passed === true ? 'Passed' : s.passed === false ? 'Failed' : '—'}</p>
              </div>
            </div>
          )) : <p className="p-4 text-sm text-[rgb(var(--muted))]">No scores yet.</p>}
        </Card>
      )}

      {tab === 'workflow' && (
        <div className="space-y-4">
          {assignments?.length ? (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Assignments</h3>
              <div className="divide-y divide-[rgb(var(--border-color))]">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{a.assigneeRole ?? 'Assignee'}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{a.status} · {a.scope}</p>
                    </div>
                    <span className="text-xs text-[rgb(var(--muted))]">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {reviews?.length ? (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Reviews</h3>
              <div className="divide-y divide-[rgb(var(--border-color))]">
                {reviews.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{r.decision}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{r.scope} · {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : 'Pending'}</p>
                    </div>
                    {r.scoreOverride != null && <span className="text-xs text-[rgb(var(--muted))]">{r.scoreOverride}</span>}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {approvals?.length ? (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Approvals</h3>
              <div className="divide-y divide-[rgb(var(--border-color))]">
                {approvals.map((ap) => (
                  <div key={ap.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Level {ap.level}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{ap.decision} · {ap.approvedAt ? new Date(ap.approvedAt).toLocaleString() : 'Pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {comments?.length ? (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Comments</h3>
              <div className="divide-y divide-[rgb(var(--border-color))]">
                {comments.map((c) => (
                  <div key={c.id} className="py-2">
                    <p className="text-sm">{c.body}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{c.kind} · {c.isResolved ? 'Resolved' : 'Open'} · {new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {attachments?.length ? (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Attachments</h3>
              <div className="divide-y divide-[rgb(var(--border-color))]">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <div>
                        <p className="text-sm font-medium">{a.fileName}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{a.kind} · {a.fileType ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {!assignments?.length && !reviews?.length && !approvals?.length && !comments?.length && !attachments?.length && (
            <p className="text-sm text-[rgb(var(--muted))]">No workflow activity yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </Card>
  );
}
