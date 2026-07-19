import { casesApi } from './module.api.js';
import type {
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

export const casesService = {
  list: (params?: { status?: string; priority?: string; category?: string; source?: string; search?: string; limit?: number; offset?: number }) =>
    casesApi.list(params),

  stats: (params?: { status?: string; priority?: string; category?: string; source?: string; search?: string }) =>
    casesApi.stats(params),

  create: (dto: CaseCreateInput) => casesApi.create(dto),

  get: (id: string) => casesApi.get(id),

  update: (id: string, patch: CaseUpdateInput) => casesApi.update(id, patch),

  delete: (id: string) => casesApi.delete(id),

  restore: (id: string) => casesApi.restore(id),

  merge: (id: string, sourceIds: string[]) => casesApi.merge(id, sourceIds),

  duplicates: (id: string) => casesApi.duplicates(id),

  addTag: (id: string, tag: string) => casesApi.addTag(id, tag),

  removeTag: (id: string, tag: string) => casesApi.removeTag(id, tag),

  addLabel: (id: string, label: string) => casesApi.addLabel(id, label),

  removeLabel: (id: string, label: string) => casesApi.removeLabel(id, label),

  addWatcher: (id: string, userId: string) => casesApi.addWatcher(id, userId),

  removeWatcher: (id: string, userId: string) => casesApi.removeWatcher(id, userId),

  assign: (id: string, userId: string) => casesApi.assign(id, userId),

  unassign: (id: string, userId: string) => casesApi.unassign(id, userId),

  addComment: (id: string, dto: CommentCreateInput) => casesApi.addComment(id, dto),

  updateComment: (id: string, commentId: string, body: string) => casesApi.updateComment(id, commentId, body),

  deleteComment: (id: string, commentId: string) => casesApi.deleteComment(id, commentId),

  addNote: (id: string, dto: NoteCreateInput) => casesApi.addNote(id, dto),

  addResponse: (id: string, dto: ResponseCreateInput) => casesApi.addResponse(id, dto),

  addEvidence: (id: string, dto: EvidenceCreateInput) => casesApi.addEvidence(id, dto),

  getEvidence: (id: string) => casesApi.getEvidence(id),

  addWitness: (id: string, dto: WitnessCreateInput) => casesApi.addWitness(id, dto),

  addInterview: (id: string, dto: InterviewCreateInput) => casesApi.addInterview(id, dto),

  addFinding: (id: string, dto: FindingCreateInput) => casesApi.addFinding(id, dto),

  addRootCause: (id: string, dto: RootCauseCreateInput) => casesApi.addRootCause(id, dto),

  addResolution: (id: string, dto: ResolutionCreateInput) => casesApi.addResolution(id, dto),

  addLink: (id: string, dto: LinkCreateInput) => casesApi.addLink(id, dto),

  removeLink: (id: string, relatedCaseId: string) => casesApi.removeLink(id, relatedCaseId),

  bulk: (id: string, action: 'delete' | 'restore' | 'archive') => casesApi.bulk(id, action),

  bulkUpdate: (caseIds: string[], patch: Record<string, unknown>) => casesApi.bulkUpdate(caseIds, patch),

  createSavedFilter: (caseId: string, dto: FilterCreateInput) => casesApi.createSavedFilter(caseId, dto),

  listSavedFilters: () => casesApi.listSavedFilters(),

  createInvestigation: (caseId: string, dto: InvestigationCreateInput) => casesApi.createInvestigation(caseId, dto),

  getInvestigation: (caseId: string) => casesApi.getInvestigation(caseId),

  updateInvestigation: (caseId: string, dto: InvestigationCreateInput) => casesApi.updateInvestigation(caseId, dto),

  listAssignments: (caseId: string) => casesApi.listAssignments(caseId),

  addAssignment: (caseId: string, dto: AssignmentCreateInput) => casesApi.addAssignment(caseId, dto),

  removeAssignment: (caseId: string, investigatorId: string) => casesApi.removeAssignment(caseId, investigatorId),

  getTimeline: (caseId: string) => casesApi.getTimeline(caseId),

  listInvestigators: () => casesApi.listInvestigators(),

  getWorkload: () => casesApi.getWorkload(),

  escalate: (caseId: string, dto: EscalationCreateInput) => casesApi.escalate(caseId, dto),

  getEscalationHistory: (caseId: string) => casesApi.getEscalationHistory(caseId),

  calculateRisk: (caseId: string) => casesApi.calculateRisk(caseId),

  getRisk: (caseId: string) => casesApi.getRisk(caseId),
};
