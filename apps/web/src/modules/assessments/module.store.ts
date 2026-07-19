'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { assessmentService } from './module.service.js';
import type { AssessmentFrameworkMapping } from './module.types.js';

export function useAssessmentDashboard() {
  return useQuery({ queryKey: ['assessments', 'dashboard'], queryFn: () => assessmentService.dashboard() });
}

export function useAnswerTypes() {
  return useQuery({ queryKey: ['assessments', 'answer-types'], queryFn: () => assessmentService.answerTypes() });
}
export function useAssessmentTypes() {
  return useQuery({ queryKey: ['assessments', 'types'], queryFn: () => assessmentService.types() });
}
export function useCategories() {
  return useQuery({ queryKey: ['assessments', 'categories'], queryFn: () => assessmentService.categories() });
}
export function useTags() {
  return useQuery({ queryKey: ['assessments', 'tags'], queryFn: () => assessmentService.tags() });
}

export function useTemplates(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['assessments', 'templates', params], queryFn: () => assessmentService.listTemplates(params) });
}
export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: any) => assessmentService.createTemplate(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.updateTemplate(v.id, v.dto), onSuccess: (_d, _v) => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.deleteTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useArchiveTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.archiveTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useRestoreTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.restoreTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function usePublishTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; changeSummary?: string }) => assessmentService.publishTemplate(v.id, v.changeSummary), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useUnpublishTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.unpublishTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.duplicateTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useCreateVersion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; changeSummary?: string }) => assessmentService.createVersion(v.id, v.changeSummary), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'templates'] }) });
}
export function useVersions(id: string) {
  return useQuery({ queryKey: ['assessments', 'versions', id], queryFn: () => assessmentService.listVersions(id), enabled: !!id });
}

export function useTemplateStructure(id: string) {
  return useQuery({ queryKey: ['assessments', 'structure', id], queryFn: () => assessmentService.getStructure(id), enabled: !!id });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; dto: any }) => assessmentService.createSection(v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; templateId: string; dto: any }) => assessmentService.updateSection(v.id, v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; templateId: string }) => assessmentService.deleteSection(v.id, v.templateId), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; ids: string[] }) => assessmentService.reorderSections(v.templateId, v.ids), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; dto: any }) => assessmentService.createQuestion(v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; templateId: string; dto: any }) => assessmentService.updateQuestion(v.id, v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; templateId: string }) => assessmentService.deleteQuestion(v.id, v.templateId), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useReorderQuestions() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; ids: string[] }) => assessmentService.reorderQuestions(v.templateId, v.ids), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}
export function useSetQuestionOptions() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; templateId: string; options: unknown[] }) => assessmentService.setQuestionOptions(v.id, v.templateId, v.options), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'structure', v.templateId] }) });
}

// Conditions & dependencies
export function useConditions(templateId: string) {
  return useQuery({ queryKey: ['assessments', 'conditions', templateId], queryFn: () => assessmentService.listConditions(templateId), enabled: !!templateId });
}
export function useCreateCondition() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; dto: any }) => assessmentService.createCondition(v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'conditions', v.templateId] }) });
}
export function useDependencies(templateId: string) {
  return useQuery({ queryKey: ['assessments', 'dependencies', templateId], queryFn: () => assessmentService.listDependencies(templateId), enabled: !!templateId });
}
export function useCreateDependency() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; dto: any }) => assessmentService.createDependency(v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'dependencies', v.templateId] }) });
}
export function useDeleteDependency() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; templateId: string }) => assessmentService.deleteDependency(v.id, v.templateId), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'dependencies', v.templateId] }) });
}

// Scoring & validation rules
export function useScoringRules(templateId: string) {
  return useQuery({ queryKey: ['assessments', 'scoring', templateId], queryFn: () => assessmentService.listScoringRules(templateId), enabled: !!templateId });
}
export function useCreateScoringRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; dto: any }) => assessmentService.createScoringRule(v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'scoring', v.templateId] }) });
}
export function useValidationRules(templateId: string) {
  return useQuery({ queryKey: ['assessments', 'validation', templateId], queryFn: () => assessmentService.listValidationRules(templateId), enabled: !!templateId });
}
export function useCreateValidationRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; dto: any }) => assessmentService.createValidationRule(v.templateId, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'validation', v.templateId] }) });
}

// Framework & control mappings
export function useFrameworkMappings(templateId: string) {
  return useQuery<AssessmentFrameworkMapping[]>({ queryKey: ['assessments', 'fw-mappings', templateId], queryFn: () => assessmentService.listFrameworkMappings(templateId), enabled: !!templateId });
}
export function useSetFrameworkMappings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; qid: string; mappings: any[] }) => assessmentService.setFrameworkMappings(v.templateId, v.qid, v.mappings), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'fw-mappings', v.templateId] }) });
}
export function useControlMappings(templateId: string) {
  return useQuery({ queryKey: ['assessments', 'ctl-mappings', templateId], queryFn: () => assessmentService.listControlMappings(templateId), enabled: !!templateId });
}
export function useSetControlMappings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { templateId: string; qid: string; mappings: any[] }) => assessmentService.setControlMappings(v.templateId, v.qid, v.mappings), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'ctl-mappings', v.templateId] }) });
}

// Library
export function useLibrary(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['assessments', 'library', params], queryFn: () => assessmentService.library(params) });
}
export function useLibraryItem(id: string) {
  return useQuery({ queryKey: ['assessments', 'library', id], queryFn: () => assessmentService.libraryItem(id), enabled: !!id });
}
export function useAssessmentSearch(q: string) {
  return useQuery({ queryKey: ['assessments', 'search', q], queryFn: () => assessmentService.search(q), enabled: q.length > 0 });
}

// Assessments (runtime)
export function useAssessments(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['assessments', 'list', params], queryFn: () => assessmentService.listAssessments(params) });
}
export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: any) => assessmentService.createAssessment(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'list'] }) });
}
export function useAssessment(id: string) {
  return useQuery({ queryKey: ['assessments', 'detail', id], queryFn: () => assessmentService.getAssessment(id), enabled: !!id });
}
export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.updateAssessment(v.id, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'detail', v.id] }) });
}
export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.deleteAssessment(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'list'] }) });
}
export function useResponses(id: string) {
  return useQuery({ queryKey: ['assessments', 'responses', id], queryFn: () => assessmentService.listResponses(id), enabled: !!id });
}
export function useSubmitResponse() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; questionId: string; payload: Record<string, unknown> }) => assessmentService.submitResponse(v.id, v.questionId, v.payload), onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ['assessments', 'responses', v.id] }); qc.invalidateQueries({ queryKey: ['assessments', 'scores', v.id] }); } });
}
export function useScores(id: string) {
  return useQuery({ queryKey: ['assessments', 'scores', id], queryFn: () => assessmentService.listScores(id), enabled: !!id });
}
export function useRecomputeScores() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.recomputeScores(id), onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['assessments', 'scores', id] }) });
}

// Workflow
export function useAssignments(id: string) {
  return useQuery({ queryKey: ['assessments', 'assignments', id], queryFn: () => assessmentService.listAssignments(id), enabled: !!id });
}
export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.createAssignment(v.id, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'assignments', v.id] }) });
}
export function useReviews(id: string) {
  return useQuery({ queryKey: ['assessments', 'reviews', id], queryFn: () => assessmentService.listReviews(id), enabled: !!id });
}
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.createReview(v.id, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'reviews', v.id] }) });
}
export function useApprovals(id: string) {
  return useQuery({ queryKey: ['assessments', 'approvals', id], queryFn: () => assessmentService.listApprovals(id), enabled: !!id });
}
export function useCreateApproval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.createApproval(v.id, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'approvals', v.id] }) });
}
export function useComments(id: string) {
  return useQuery({ queryKey: ['assessments', 'comments', id], queryFn: () => assessmentService.listComments(id), enabled: !!id });
}
export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.createComment(v.id, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'comments', v.id] }) });
}
export function useResolveComment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; cid: string }) => assessmentService.resolveComment(v.id, v.cid), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'comments', v.id] }) });
}
export function useAttachments(id: string) {
  return useQuery({ queryKey: ['assessments', 'attachments', id], queryFn: () => assessmentService.listAttachments(id), enabled: !!id });
}
export function useCreateAttachment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.createAttachment(v.id, v.dto), onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['assessments', 'attachments', v.id] }) });
}

export function useSchedulePlaceholders() {
  return useQuery({ queryKey: ['assessments', 'schedule-placeholders'], queryFn: () => assessmentService.listSchedulePlaceholders() });
}
export function useCreateSchedulePlaceholder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: any) => assessmentService.createSchedulePlaceholder(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'schedule-placeholders'] }) });
}

// Categories
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: any) => assessmentService.createCategory(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'categories'] }) });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; dto: any }) => assessmentService.updateCategory(v.id, v.dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'categories'] }) });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => assessmentService.deleteCategory(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments', 'categories'] }) });
}
