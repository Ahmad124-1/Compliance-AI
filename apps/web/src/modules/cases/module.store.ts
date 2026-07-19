'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { casesService } from './module.service.js';
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

export function useCaseStats(params?: { status?: string; priority?: string; category?: string; source?: string; search?: string }) {
  return useQuery({
    queryKey: ['cases', 'stats', params],
    queryFn: () => casesService.stats(params),
  });
}

export function useCases(params?: { status?: string; priority?: string; category?: string; source?: string; search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['cases', 'list', params],
    queryFn: () => casesService.list(params),
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: () => casesService.get(id),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CaseCreateInput) => casesService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: CaseUpdateInput }) => casesService.update(vars.id, vars.patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => casesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useRestoreCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => casesService.restore(id),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['cases', id] }),
  });
}

export function useMergeCases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; sourceIds: string[] }) => casesService.merge(vars.id, vars.sourceIds),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useCaseDuplicates(id: string) {
  return useQuery({
    queryKey: ['cases', id, 'duplicates'],
    queryFn: () => casesService.duplicates(id),
    enabled: !!id,
  });
}

export function useAddTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; tag: string }) => casesService.addTag(vars.id, vars.tag),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useRemoveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; tag: string }) => casesService.removeTag(vars.id, vars.tag),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; label: string }) => casesService.addLabel(vars.id, vars.label),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useRemoveLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; label: string }) => casesService.removeLabel(vars.id, vars.label),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddWatcher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; userId: string }) => casesService.addWatcher(vars.id, vars.userId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useRemoveWatcher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; userId: string }) => casesService.removeWatcher(vars.id, vars.userId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAssignCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; userId: string }) => casesService.assign(vars.id, vars.userId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useUnassignCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; userId: string }) => casesService.unassign(vars.id, vars.userId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: CommentCreateInput }) => casesService.addComment(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; commentId: string; body: string }) => casesService.updateComment(vars.id, vars.commentId, vars.body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; commentId: string }) => casesService.deleteComment(vars.id, vars.commentId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: NoteCreateInput }) => casesService.addNote(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: ResponseCreateInput }) => casesService.addResponse(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: EvidenceCreateInput }) => casesService.addEvidence(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useGetEvidence(id: string) {
  return useQuery({
    queryKey: ['cases', id, 'evidence'],
    queryFn: () => casesService.getEvidence(id),
    enabled: !!id,
  });
}

export function useAddWitness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: WitnessCreateInput }) => casesService.addWitness(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: InterviewCreateInput }) => casesService.addInterview(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: FindingCreateInput }) => casesService.addFinding(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddRootCause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: RootCauseCreateInput }) => casesService.addRootCause(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddResolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: ResolutionCreateInput }) => casesService.addResolution(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useAddLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dto: LinkCreateInput }) => casesService.addLink(vars.id, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useRemoveLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; relatedCaseId: string }) => casesService.removeLink(vars.id, vars.relatedCaseId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.id] }),
  });
}

export function useBulkCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; action: 'delete' | 'restore' | 'archive' }) => casesService.bulk(vars.id, vars.action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useBulkUpdateCases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseIds: string[]; patch: Record<string, unknown> }) => casesService.bulkUpdate(vars.caseIds, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useCreateSavedFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; dto: FilterCreateInput }) => casesService.createSavedFilter(vars.caseId, vars.dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', 'saved-filters'] }),
  });
}

export function useSavedFilters() {
  return useQuery({
    queryKey: ['cases', 'saved-filters'],
    queryFn: () => casesService.listSavedFilters(),
  });
}

export function useCreateInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; dto: InvestigationCreateInput }) => casesService.createInvestigation(vars.caseId, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.caseId] }),
  });
}

export function useGetInvestigation(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'investigation'],
    queryFn: () => casesService.getInvestigation(caseId),
    enabled: !!caseId,
  });
}

export function useUpdateInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; dto: InvestigationCreateInput }) => casesService.updateInvestigation(vars.caseId, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.caseId] }),
  });
}

export function useListAssignments(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'assignments'],
    queryFn: () => casesService.listAssignments(caseId),
    enabled: !!caseId,
  });
}

export function useAddAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; dto: AssignmentCreateInput }) => casesService.addAssignment(vars.caseId, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.caseId] }),
  });
}

export function useRemoveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; investigatorId: string }) => casesService.removeAssignment(vars.caseId, vars.investigatorId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.caseId] }),
  });
}

export function useTimeline(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'timeline'],
    queryFn: () => casesService.getTimeline(caseId),
    enabled: !!caseId,
  });
}

export function useInvestigators() {
  return useQuery({
    queryKey: ['cases', 'investigators'],
    queryFn: () => casesService.listInvestigators(),
  });
}

export function useInvestigatorWorkload() {
  return useQuery({
    queryKey: ['cases', 'workload'],
    queryFn: () => casesService.getWorkload(),
  });
}

export function useEscalate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { caseId: string; dto: EscalationCreateInput }) => casesService.escalate(vars.caseId, vars.dto),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cases', v.caseId] }),
  });
}

export function useEscalationHistory(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'escalation'],
    queryFn: () => casesService.getEscalationHistory(caseId),
    enabled: !!caseId,
  });
}

export function useCalculateRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => casesService.calculateRisk(caseId),
    onSuccess: (_d, caseId) => qc.invalidateQueries({ queryKey: ['cases', caseId] }),
  });
}

export function useRiskScore(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'risk'],
    queryFn: () => casesService.getRisk(caseId),
    enabled: !!caseId,
  });
}
