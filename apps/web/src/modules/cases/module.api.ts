import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { CASE_ENDPOINTS } from './module.constants.js';
import type {
  CaseItem,
  CaseActivity,
  CaseComment,
  InternalNote,
  PublicResponse,
  CaseEvidence,
  CaseWitness,
  CaseInterview,
  CaseFinding,
  CaseRootCause,
  CaseResolution,
  CaseStatusHistory,
  CaseWatcher,
  CaseTag,
  CaseLabel,
  CaseLink,
  Investigation,
  InvestigationAssignment,
  InvestigationTimeline,
  RiskScore,
  EscalationHistory,
  SavedCaseFilter,
  CaseStats,
  CaseCreateInput,
  CaseUpdateInput,
  CommentCreateInput,
  NoteCreateInput,
  ResponseCreateInput,
  EvidenceCreateInput,
  WitnessCreateInput,
  InterviewCreateInput,
  FindingCreateInput,
  RootCauseCreateInput,
  ResolutionCreateInput,
  InvestigationCreateInput,
  AssignmentCreateInput,
  LinkCreateInput,
  FilterCreateInput,
  EscalationCreateInput,
} from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const casesApi = {
  list: (params?: { status?: string; priority?: string; category?: string; source?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.priority) qs.set('priority', params.priority);
    if (params?.category) qs.set('category', params.category);
    if (params?.source) qs.set('source', params.source);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return http<{ cases: CaseItem[]; total: number }>(`${CASE_ENDPOINTS.list}${q ? `?${q}` : ''}`);
  },

  stats: (params?: { status?: string; priority?: string; category?: string; source?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.priority) qs.set('priority', params.priority);
    if (params?.category) qs.set('category', params.category);
    if (params?.source) qs.set('source', params.source);
    if (params?.search) qs.set('search', params.search);
    const q = qs.toString();
    return http<CaseStats>(`${CASE_ENDPOINTS.stats}${q ? `?${q}` : ''}`);
  },

  create: (dto: CaseCreateInput) => http<CaseItem>(CASE_ENDPOINTS.create, { method: 'POST', body: JSON.stringify(dto) }),

  get: (id: string) => http<CaseItem & {
    activities: CaseActivity[];
    comments: CaseComment[];
    notes: InternalNote[];
    responses: PublicResponse[];
    evidence: CaseEvidence[];
    witnesses: CaseWitness[];
    interviews: CaseInterview[];
    findings: CaseFinding[];
    rootCauses: CaseRootCause[];
    resolutions: CaseResolution[];
    statusHistory: CaseStatusHistory[];
    watchers: CaseWatcher[];
    tags: CaseTag[];
    labels: CaseLabel[];
    links: CaseLink[];
    investigation: Investigation | null;
    riskScore: RiskScore | null;
  }>(CASE_ENDPOINTS.get(id)),

  update: (id: string, patch: CaseUpdateInput) => http<CaseItem>(CASE_ENDPOINTS.update(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  delete: (id: string) => http<void>(CASE_ENDPOINTS.delete(id), { method: 'DELETE' }),

  restore: (id: string) => http<void>(CASE_ENDPOINTS.restore(id), { method: 'POST' }),

  merge: (id: string, sourceIds: string[]) => http<void>(CASE_ENDPOINTS.merge(id), { method: 'POST', body: JSON.stringify({ sourceIds }) }),

  duplicates: (id: string) => http<CaseItem[]>(CASE_ENDPOINTS.duplicates(id)),

  addTag: (id: string, tag: string) => http<CaseTag>(CASE_ENDPOINTS.tags.add(id), { method: 'POST', body: JSON.stringify({ tag }) }),

  removeTag: (id: string, tag: string) => http<void>(CASE_ENDPOINTS.tags.remove(id, tag), { method: 'DELETE' }),

  addLabel: (id: string, label: string) => http<CaseLabel>(CASE_ENDPOINTS.labels.add(id), { method: 'POST', body: JSON.stringify({ label }) }),

  removeLabel: (id: string, label: string) => http<void>(CASE_ENDPOINTS.labels.remove(id, label), { method: 'DELETE' }),

  addWatcher: (id: string, userId: string) => http<CaseWatcher>(CASE_ENDPOINTS.watchers.add(id), { method: 'POST', body: JSON.stringify({ userId }) }),

  removeWatcher: (id: string, userId: string) => http<void>(CASE_ENDPOINTS.watchers.remove(id, userId), { method: 'DELETE' }),

  assign: (id: string, userId: string) => http<CaseItem>(CASE_ENDPOINTS.assign(id), { method: 'POST', body: JSON.stringify({ userId }) }),

  unassign: (id: string, userId: string) => http<void>(CASE_ENDPOINTS.unassign(id, userId), { method: 'DELETE' }),

  addComment: (id: string, dto: CommentCreateInput) => http<CaseComment>(CASE_ENDPOINTS.comments.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  updateComment: (id: string, commentId: string, body: string) => http<CaseComment>(CASE_ENDPOINTS.comments.update(id, commentId), { method: 'PATCH', body: JSON.stringify({ body }) }),

  deleteComment: (id: string, commentId: string) => http<void>(CASE_ENDPOINTS.comments.delete(id, commentId), { method: 'DELETE' }),

  addNote: (id: string, dto: NoteCreateInput) => http<InternalNote>(CASE_ENDPOINTS.notes.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addResponse: (id: string, dto: ResponseCreateInput) => http<PublicResponse>(CASE_ENDPOINTS.responses.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addEvidence: (id: string, dto: EvidenceCreateInput) => http<CaseEvidence>(CASE_ENDPOINTS.evidence.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  getEvidence: (id: string) => http<CaseEvidence[]>(CASE_ENDPOINTS.evidence.list(id)),

  addWitness: (id: string, dto: WitnessCreateInput) => http<CaseWitness>(CASE_ENDPOINTS.witnesses.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addInterview: (id: string, dto: InterviewCreateInput) => http<CaseInterview>(CASE_ENDPOINTS.interviews.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addFinding: (id: string, dto: FindingCreateInput) => http<CaseFinding>(CASE_ENDPOINTS.findings.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addRootCause: (id: string, dto: RootCauseCreateInput) => http<CaseRootCause>(CASE_ENDPOINTS.rootCauses.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addResolution: (id: string, dto: ResolutionCreateInput) => http<CaseResolution>(CASE_ENDPOINTS.resolutions.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  addLink: (id: string, dto: LinkCreateInput) => http<CaseLink>(CASE_ENDPOINTS.links.add(id), { method: 'POST', body: JSON.stringify(dto) }),

  removeLink: (id: string, relatedCaseId: string) => http<void>(CASE_ENDPOINTS.links.remove(id, relatedCaseId), { method: 'DELETE' }),

  bulk: (id: string, action: 'delete' | 'restore' | 'archive') => http<void>(CASE_ENDPOINTS.bulk(id), { method: 'POST', body: JSON.stringify({ action }) }),

  bulkUpdate: (caseIds: string[], patch: Record<string, unknown>) => http<void>(CASE_ENDPOINTS.bulkMultiple, { method: 'POST', body: JSON.stringify({ caseIds, patch }) }),

  createSavedFilter: (caseId: string, dto: FilterCreateInput) => http<SavedCaseFilter>(CASE_ENDPOINTS.savedFilters.create.replace(':id', caseId), { method: 'POST', body: JSON.stringify(dto) }),

  listSavedFilters: () => http<SavedCaseFilter[]>(CASE_ENDPOINTS.savedFilters.list),

  createInvestigation: (caseId: string, dto: InvestigationCreateInput) => http<Investigation>(CASE_ENDPOINTS.investigations.create(caseId), { method: 'POST', body: JSON.stringify(dto) }),

  getInvestigation: (caseId: string) => http<Investigation & { assignments: InvestigationAssignment[]; timeline: InvestigationTimeline[] }>(CASE_ENDPOINTS.investigations.get(caseId)),

  updateInvestigation: (caseId: string, dto: InvestigationCreateInput) => http<Investigation>(CASE_ENDPOINTS.investigations.update(caseId), { method: 'PATCH', body: JSON.stringify(dto) }),

  listAssignments: (caseId: string) => http<InvestigationAssignment[]>(CASE_ENDPOINTS.investigations.assignments.list(caseId)),

  addAssignment: (caseId: string, dto: AssignmentCreateInput) => http<InvestigationAssignment>(CASE_ENDPOINTS.investigations.assignments.add(caseId), { method: 'POST', body: JSON.stringify(dto) }),

  removeAssignment: (caseId: string, investigatorId: string) => http<void>(CASE_ENDPOINTS.investigations.assignments.remove(caseId, investigatorId), { method: 'DELETE' }),

  getTimeline: (caseId: string) => http<InvestigationTimeline[]>(CASE_ENDPOINTS.investigations.timeline(caseId)),

  listInvestigators: () => http<any[]>(CASE_ENDPOINTS.investigators.list),

  getWorkload: () => http<any[]>(CASE_ENDPOINTS.investigators.workload),

  escalate: (caseId: string, dto: EscalationCreateInput) => http<CaseItem>(CASE_ENDPOINTS.escalation.escalate(caseId), { method: 'POST', body: JSON.stringify(dto) }),

  getEscalationHistory: (caseId: string) => http<EscalationHistory[]>(CASE_ENDPOINTS.escalation.history(caseId)),

  calculateRisk: (caseId: string) => http<RiskScore>(CASE_ENDPOINTS.risk.calculate(caseId), { method: 'POST' }),

  getRisk: (caseId: string) => http<RiskScore>(CASE_ENDPOINTS.risk.get(caseId)),
};
