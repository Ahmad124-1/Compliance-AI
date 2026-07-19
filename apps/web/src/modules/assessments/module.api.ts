import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { ASSESSMENT_ENDPOINTS } from './module.constants.js';
import type {
  AssessmentTemplate, AssessmentCategory, AssessmentTag, AssessmentTypeCatalogue, AssessmentAnswerType,
  AssessmentSection, AssessmentQuestion, AssessmentAnswerOption, AssessmentCondition, AssessmentDependency, AssessmentScoringRule,
  AssessmentValidationRule, AssessmentFrameworkMapping, AssessmentControlMapping, FrameworkMappingInput,
  ControlMappingInput, AssessmentLibraryItem, Paginated, Assessment, AssessmentResponse, AssessmentScore,
  AssessmentAssignment, AssessmentReview, AssessmentApproval, AssessmentComment, AssessmentAttachment,
  AssessmentSchedulePlaceholder, AssessmentTemplateVersion, TemplateStructure, AssessmentDashboard,
} from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function qs(params: Record<string, unknown>): string {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const assessmentApi = {
  // Dashboard
  dashboard: () => http<AssessmentDashboard>(ASSESSMENT_ENDPOINTS.dashboard),

  // Catalogue
  answerTypes: () => http<AssessmentAnswerType[]>(ASSESSMENT_ENDPOINTS.answerTypes),
  types: () => http<AssessmentTypeCatalogue[]>(ASSESSMENT_ENDPOINTS.types),
  categories: () => http<AssessmentCategory[]>(ASSESSMENT_ENDPOINTS.categories),
  createCategory: (dto: Partial<AssessmentCategory>) => http<AssessmentCategory>(ASSESSMENT_ENDPOINTS.categories, { method: 'POST', body: JSON.stringify(dto) }),
  updateCategory: (id: string, dto: Partial<AssessmentCategory>) => http<AssessmentCategory>(`${ASSESSMENT_ENDPOINTS.categories}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteCategory: (id: string) => http(`${ASSESSMENT_ENDPOINTS.categories}/${id}`, { method: 'DELETE' }),
  tags: () => http<AssessmentTag[]>(ASSESSMENT_ENDPOINTS.tags),

  // Templates
  listTemplates: (params: Record<string, unknown> = {}) => http<Paginated<AssessmentTemplate>>(`${ASSESSMENT_ENDPOINTS.templates}${qs(params)}`),
  createTemplate: (dto: Partial<AssessmentTemplate>) => http<AssessmentTemplate>(ASSESSMENT_ENDPOINTS.templates, { method: 'POST', body: JSON.stringify(dto) }),
  getTemplate: (id: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}`),
  getStructure: (id: string) => http<TemplateStructure>(ASSESSMENT_ENDPOINTS.templateStructure(id)),
  updateTemplate: (id: string, dto: Partial<AssessmentTemplate>) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteTemplate: (id: string) => http(`${ASSESSMENT_ENDPOINTS.templates}/${id}`, { method: 'DELETE' }),
  archiveTemplate: (id: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/archive`, { method: 'POST' }),
  restoreTemplate: (id: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/restore`, { method: 'POST' }),
  publishTemplate: (id: string, changeSummary?: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/publish`, { method: 'POST', body: JSON.stringify({ changeSummary }) }),
  unpublishTemplate: (id: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/unpublish`, { method: 'POST' }),
  duplicateTemplate: (id: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/duplicate`, { method: 'POST' }),
  cloneTemplate: (id: string, targetOrganizationId: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/clone`, { method: 'POST', body: JSON.stringify({ targetOrganizationId }) }),
  createVersion: (id: string, changeSummary?: string) => http<AssessmentTemplate>(`${ASSESSMENT_ENDPOINTS.templates}/${id}/version`, { method: 'POST', body: JSON.stringify({ changeSummary }) }),
  listVersions: (id: string) => http<AssessmentTemplateVersion[]>(ASSESSMENT_ENDPOINTS.templateVersions(id)),
  getVersion: (id: string, version: number) => http<AssessmentTemplateVersion>(`${ASSESSMENT_ENDPOINTS.templateVersions(id)}/${version}`),

  // Sections
  createSection: (templateId: string, dto: Partial<AssessmentSection> & { title: string; position: number }) => http<AssessmentSection>(ASSESSMENT_ENDPOINTS.sections(templateId), { method: 'POST', body: JSON.stringify(dto) }),
  updateSection: (id: string, templateId: string, dto: Partial<AssessmentSection>) => http<AssessmentSection>(`/api/v1/assessments/sections/${id}`, { method: 'PATCH', body: JSON.stringify({ templateId, ...dto }) }),
  deleteSection: (id: string, templateId: string) => http(`/api/v1/assessments/sections/${id}?templateId=${templateId}`, { method: 'DELETE' }),
  reorderSections: (templateId: string, orderedIds: string[]) => http(`/api/v1/assessments/templates/${templateId}/sections/reorder`, { method: 'POST', body: JSON.stringify({ orderedIds }) }),

  // Questions
  createQuestion: (templateId: string, dto: Record<string, unknown>) => http<AssessmentQuestion>(ASSESSMENT_ENDPOINTS.questions(templateId), { method: 'POST', body: JSON.stringify(dto) }),
  updateQuestion: (id: string, templateId: string, dto: Record<string, unknown>) => http<AssessmentQuestion>(`/api/v1/assessments/questions/${id}`, { method: 'PATCH', body: JSON.stringify({ templateId, ...dto }) }),
  deleteQuestion: (id: string, templateId: string) => http(`/api/v1/assessments/questions/${id}?templateId=${templateId}`, { method: 'DELETE' }),
  reorderQuestions: (templateId: string, orderedIds: string[]) => http(`/api/v1/assessments/templates/${templateId}/questions/reorder`, { method: 'POST', body: JSON.stringify({ orderedIds }) }),
  setQuestionOptions: (id: string, templateId: string, options: unknown[]) => http<AssessmentAnswerOption[]>(`/api/v1/assessments/questions/${id}/options`, { method: 'PUT', body: JSON.stringify({ templateId, options }) }),

  // Conditions & dependencies
  createCondition: (templateId: string, dto: { name?: string | null; description?: string | null; logic: unknown }) => http<AssessmentCondition>(ASSESSMENT_ENDPOINTS.conditions(templateId), { method: 'POST', body: JSON.stringify(dto) }),
  listConditions: (templateId: string) => http<AssessmentCondition[]>(ASSESSMENT_ENDPOINTS.conditions(templateId)),
  createDependency: (templateId: string, dto: { questionId: string; dependsOnQuestionId: string; dependencyType?: string; condition?: unknown }) => http<AssessmentDependency>(ASSESSMENT_ENDPOINTS.dependencies(templateId), { method: 'POST', body: JSON.stringify(dto) }),
  listDependencies: (templateId: string) => http<AssessmentDependency[]>(ASSESSMENT_ENDPOINTS.dependencies(templateId)),
  deleteDependency: (id: string, templateId: string) => http(`/api/v1/assessments/dependencies/${id}?templateId=${templateId}`, { method: 'DELETE' }),

  // Scoring & validation
  createScoringRule: (templateId: string, dto: Record<string, unknown>) => http<AssessmentScoringRule>(ASSESSMENT_ENDPOINTS.scoringRules(templateId), { method: 'POST', body: JSON.stringify(dto) }),
  listScoringRules: (templateId: string) => http<AssessmentScoringRule[]>(ASSESSMENT_ENDPOINTS.scoringRules(templateId)),
  createValidationRule: (templateId: string, dto: Record<string, unknown>) => http<AssessmentValidationRule>(ASSESSMENT_ENDPOINTS.validationRules(templateId), { method: 'POST', body: JSON.stringify(dto) }),
  listValidationRules: (templateId: string) => http<AssessmentValidationRule[]>(ASSESSMENT_ENDPOINTS.validationRules(templateId)),

  // Framework & control mappings
  setFrameworkMappings: (templateId: string, qid: string, mappings: FrameworkMappingInput[]) => http<AssessmentFrameworkMapping[]>(`/api/v1/assessments/templates/${templateId}/questions/${qid}/framework-mappings`, { method: 'PUT', body: JSON.stringify({ mappings }) }),
  listFrameworkMappings: (templateId: string) => http<AssessmentFrameworkMapping[]>(ASSESSMENT_ENDPOINTS.frameworkMappings(templateId)),
  setControlMappings: (templateId: string, qid: string, mappings: ControlMappingInput[]) => http<AssessmentControlMapping[]>(`/api/v1/assessments/templates/${templateId}/questions/${qid}/control-mappings`, { method: 'PUT', body: JSON.stringify({ mappings }) }),
  listControlMappings: (templateId: string) => http<AssessmentControlMapping[]>(ASSESSMENT_ENDPOINTS.controlMappings(templateId)),

  // Library
  library: (params: Record<string, unknown> = {}) => http<Paginated<AssessmentLibraryItem>>(`${ASSESSMENT_ENDPOINTS.library}${qs(params)}`),
  libraryItem: (id: string) => http<TemplateStructure>(`${ASSESSMENT_ENDPOINTS.library}/${id}`),
  search: (q: string) => http<{ templates: unknown[]; assessments: unknown[] }>(`${ASSESSMENT_ENDPOINTS.search}?q=${encodeURIComponent(q)}`),

  // Assessments (runtime)
  listAssessments: (params: Record<string, unknown> = {}) => http<Paginated<Assessment>>(`${ASSESSMENT_ENDPOINTS.assessments}${qs(params)}`),
  createAssessment: (dto: Partial<Assessment>) => http<Assessment>(ASSESSMENT_ENDPOINTS.assessments, { method: 'POST', body: JSON.stringify(dto) }),
  getAssessment: (id: string) => http<Assessment>(ASSESSMENT_ENDPOINTS.assignment(id)),
  updateAssessment: (id: string, dto: Partial<Assessment>) => http<Assessment>(ASSESSMENT_ENDPOINTS.assignment(id), { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteAssessment: (id: string) => http(ASSESSMENT_ENDPOINTS.assignment(id), { method: 'DELETE' }),

  listResponses: (id: string) => http<AssessmentResponse[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/responses`),
  submitResponse: (id: string, questionId: string, payload: Record<string, unknown>) => http(`${ASSESSMENT_ENDPOINTS.assignment(id)}/responses`, { method: 'POST', body: JSON.stringify({ questionId, ...payload }) }),
  listScores: (id: string) => http<AssessmentScore[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/scores`),
  recomputeScores: (id: string) => http(`${ASSESSMENT_ENDPOINTS.assignment(id)}/scores/recompute`, { method: 'POST' }),

  // Workflow
  createAssignment: (id: string, dto: Record<string, unknown>) => http<AssessmentAssignment>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/assignments`, { method: 'POST', body: JSON.stringify(dto) }),
  listAssignments: (id: string) => http<AssessmentAssignment[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/assignments`),
  createReview: (id: string, dto: Record<string, unknown>) => http<AssessmentReview>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/reviews`, { method: 'POST', body: JSON.stringify(dto) }),
  listReviews: (id: string) => http<AssessmentReview[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/reviews`),
  createApproval: (id: string, dto: Record<string, unknown>) => http<AssessmentApproval>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/approvals`, { method: 'POST', body: JSON.stringify(dto) }),
  listApprovals: (id: string) => http<AssessmentApproval[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/approvals`),
  createComment: (id: string, dto: { body: string; kind?: string; scope?: string; targetId?: string | null; parentCommentId?: string | null }) => http<AssessmentComment>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/comments`, { method: 'POST', body: JSON.stringify(dto) }),
  listComments: (id: string) => http<AssessmentComment[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/comments`),
  resolveComment: (id: string, cid: string) => http(`${ASSESSMENT_ENDPOINTS.assignment(id)}/comments/${cid}/resolve`, { method: 'POST', body: JSON.stringify({ resolved: true }) }),
  createAttachment: (id: string, dto: Record<string, unknown>) => http<AssessmentAttachment>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/attachments`, { method: 'POST', body: JSON.stringify(dto) }),
  listAttachments: (id: string) => http<AssessmentAttachment[]>(`${ASSESSMENT_ENDPOINTS.assignment(id)}/attachments`),

  // Schedule placeholders
  createSchedulePlaceholder: (dto: Record<string, unknown>) => http<AssessmentSchedulePlaceholder>(ASSESSMENT_ENDPOINTS.schedulePlaceholders, { method: 'POST', body: JSON.stringify(dto) }),
  listSchedulePlaceholders: () => http<AssessmentSchedulePlaceholder[]>(ASSESSMENT_ENDPOINTS.schedulePlaceholders),
};
