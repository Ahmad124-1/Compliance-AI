import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { assessmentService } from '../modules/assessments/services/assessment.service.js';
import type { FrameworkMappingInput, ControlMappingInput } from '../modules/assessments/types.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

// --------------------------------------------------------------------------
// Shared schemas
// --------------------------------------------------------------------------

const frameworkMappingSchema = z.object({
  framework: z.enum(['SMETA', 'SA8000', 'ISO_9001', 'ISO_14001', 'ISO_45001', 'GRI', 'BSCI', 'amfori', 'customer_code', 'internal_standard', 'existing_control']),
  frameworkId: z.string().uuid().nullable().optional(),
  requirementId: z.string().uuid().nullable().optional(),
  controlId: z.string().uuid().nullable().optional(),
  clauseCode: z.string().nullable().optional(),
  mappingStrength: z.enum(['direct', 'partial', 'indirect']).optional(),
  notes: z.string().nullable().optional(),
});

const controlMappingSchema = z.object({
  controlSource: z.enum(['existing_control', 'internal_standard', 'customer_code']),
  controlId: z.string().uuid().nullable().optional(),
  controlCode: z.string().nullable().optional(),
  controlTitle: z.string().nullable().optional(),
  mappingStrength: z.enum(['direct', 'partial', 'indirect']).optional(),
  notes: z.string().nullable().optional(),
});

const optionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  position: z.number().int().default(0),
  score: z.number().default(0),
  description: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  conditionalLogic: z.any().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

const condSchema = z.any();

export async function assessmentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  const read = requirePermission('assessment:read');
  const create = requirePermission('assessment:create');
  const update = requirePermission('assessment:update');
  const del = requirePermission('assessment:delete');

  // ======================================================================
  // Dashboard + catalogue
  // ======================================================================
  app.get('/assessments/dashboard', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.dashboard(auth.org);
  });

  app.get('/assessments/catalogue/answer-types', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.listAnswerTypes(auth.org);
  });

  app.get('/assessments/catalogue/types', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.listTypes(auth.org);
  });

  app.get('/assessments/catalogue/categories', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.listCategories(auth.org);
  });

  app.post('/assessments/catalogue/categories', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as { name: string; code?: string | null; description?: string | null; color?: string | null; position?: number };
    return assessmentService.createCategory(auth.org, b);
  });

  app.patch('/assessments/catalogue/categories/:id', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.updateCategory(auth.org, id, req.body as any);
  });

  app.delete('/assessments/catalogue/categories/:id', { preHandler: del }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await assessmentService.removeCategory(auth.org, id);
    return { success: true };
  });

  app.get('/assessments/catalogue/tags', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.listTags(auth.org);
  });

  // ======================================================================
  // Templates
  // ======================================================================
  app.get('/assessments/templates', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string>;
    return assessmentService.listTemplates(auth.org, {
      search: q.search, type: q.type as any, categoryId: q.categoryId, status: q.status as any,
      tag: q.tag, framework: q.framework, version: q.version ? parseInt(q.version, 10) : undefined,
      sort: q.sort, order: q.order as any, page: q.page ? parseInt(q.page, 10) : 1, pageSize: q.pageSize ? parseInt(q.pageSize, 10) : 20,
    });
  });

  app.post('/assessments/templates', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as any;
    return assessmentService.createTemplate(auth.org, { ...b, tags: b.tags ?? [] }, auth.sub);
  });

  app.get('/assessments/templates/:id', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.getTemplate(auth.org, id);
  });

  app.get('/assessments/templates/:id/structure', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.getTemplateWithStructure(auth.org, id);
  });

  app.patch('/assessments/templates/:id', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.updateTemplate(auth.org, id, req.body as any, auth.sub);
  });

  app.delete('/assessments/templates/:id', { preHandler: del }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await assessmentService.deleteTemplate(auth.org, id);
    return { success: true };
  });

  // Template lifecycle
  app.post('/assessments/templates/:id/archive', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.archiveTemplate(auth.org, id, auth.sub);
  });
  app.post('/assessments/templates/:id/restore', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.restoreTemplate(auth.org, id, auth.sub);
  });
  app.post('/assessments/templates/:id/publish', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { changeSummary?: string };
    return assessmentService.publishTemplate(auth.org, id, auth.sub, b?.changeSummary);
  });
  app.post('/assessments/templates/:id/unpublish', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.unpublishTemplate(auth.org, id, auth.sub);
  });
  app.post('/assessments/templates/:id/duplicate', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.duplicateTemplate(auth.org, id, auth.sub);
  });
  app.post('/assessments/templates/:id/clone', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { targetOrganizationId: string };
    return assessmentService.cloneTemplate(auth.org, id, b.targetOrganizationId, auth.sub);
  });
  app.post('/assessments/templates/:id/version', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { changeSummary?: string };
    return assessmentService.createVersionDraft(auth.org, id, auth.sub, b?.changeSummary);
  });
  app.get('/assessments/templates/:id/versions', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listVersions(auth.org, id);
  });
  app.get('/assessments/templates/:id/versions/:version', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id, version } = req.params as { id: string; version: string };
    return assessmentService.getVersion(auth.org, id, parseInt(version, 10));
  });

  // ======================================================================
  // Checklist builder — sections
  // ======================================================================
  app.post('/assessments/templates/:id/sections', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { title: string; position: number } & Record<string, unknown>;
    return assessmentService.createSection(auth.org, id, b, auth.sub);
  });
  app.patch('/assessments/sections/:id', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { templateId, ...patch } = req.body as { templateId: string } & Record<string, unknown>;
    return assessmentService.updateSection(auth.org, templateId, id, patch as any, auth.sub);
  });
  app.delete('/assessments/sections/:id', { preHandler: del }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { templateId } = req.query as { templateId: string };
    await assessmentService.deleteSection(auth.org, templateId, id, auth.sub);
    return { success: true };
  });
  app.post('/assessments/templates/:id/sections/reorder', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { orderedIds: string[] };
    await assessmentService.reorderSections(auth.org, id, b.orderedIds, auth.sub);
    return { success: true };
  });

  // ======================================================================
  // Checklist builder — questions
  // ======================================================================
  app.post('/assessments/templates/:id/questions', { preHandler: update, schema: { body: z.object({
    sectionId: z.string().uuid().nullable().optional(),
    parentQuestionId: z.string().uuid().nullable().optional(),
    groupId: z.string().uuid().nullable().optional(),
    code: z.string().nullable().optional(),
    label: z.string().min(1),
    helpText: z.string().nullable().optional(),
    answerTypeId: z.string().uuid().nullable().optional(),
    answerTypeKey: z.string().min(1),
    position: z.number().int(),
    weight: z.number().optional(),
    isRequired: z.boolean().optional(),
    allowsMultiple: z.boolean().optional(),
    maxSelections: z.number().int().nullable().optional(),
    scoringConfig: z.record(z.any()).optional(),
    validationRules: z.record(z.any()).optional(),
    conditionalLogic: condSchema.nullable().optional(),
    visibilityRules: condSchema.nullable().optional(),
    dependencyRules: condSchema.nullable().optional(),
    frameworkMappings: z.array(frameworkMappingSchema).optional(),
    controlMappings: z.array(controlMappingSchema).optional(),
    metadata: z.record(z.any()).optional(),
    options: z.array(optionSchema).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.createQuestion(auth.org, id, req.body as any, auth.sub);
  });
  app.patch('/assessments/questions/:id', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { templateId, ...patch } = req.body as { templateId: string } & Record<string, unknown>;
    return assessmentService.updateQuestion(auth.org, templateId, id, patch as any, auth.sub);
  });
  app.delete('/assessments/questions/:id', { preHandler: del }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { templateId } = req.query as { templateId: string };
    await assessmentService.deleteQuestion(auth.org, templateId, id, auth.sub);
    return { success: true };
  });
  app.post('/assessments/templates/:id/questions/reorder', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { orderedIds: string[] };
    await assessmentService.reorderQuestions(auth.org, id, b.orderedIds, auth.sub);
    return { success: true };
  });
  app.put('/assessments/questions/:id/options', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { templateId: string; options: z.infer<typeof optionSchema>[] };
    return assessmentService.setQuestionOptions(auth.org, b.templateId, id, b.options, auth.sub);
  });

  // ======================================================================
  // Conditional logic + dependencies
  // ======================================================================
  app.post('/assessments/templates/:id/conditions', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { name?: string | null; description?: string | null; logic: unknown };
    return assessmentService.createCondition(auth.org, { ...b, templateId: id }, auth.sub);
  });
  app.get('/assessments/templates/:id/conditions', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listConditions(auth.org, id);
  });
  app.post('/assessments/templates/:id/dependencies', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { questionId: string; dependsOnQuestionId: string; dependencyType?: string; condition?: unknown };
    return assessmentService.createDependency(auth.org, id, b, auth.sub);
  });
  app.get('/assessments/templates/:id/dependencies', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listDependencies(auth.org, id);
  });
  app.delete('/assessments/dependencies/:id', { preHandler: del }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { templateId } = req.query as { templateId: string };
    await assessmentService.deleteDependency(auth.org, templateId, id, auth.sub);
    return { success: true };
  });

  // ======================================================================
  // Scoring + validation rules
  // ======================================================================
  app.post('/assessments/templates/:id/scoring-rules', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as any;
    return assessmentService.createScoringRule(auth.org, { ...b, templateId: id }, auth.sub);
  });
  app.get('/assessments/templates/:id/scoring-rules', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listScoringRules(auth.org, id);
  });
  app.post('/assessments/templates/:id/validation-rules', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as any;
    return assessmentService.createValidationRule(auth.org, { ...b, templateId: id }, auth.sub);
  });
  app.get('/assessments/templates/:id/validation-rules', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listValidationRules(auth.org, id);
  });

  // ======================================================================
  // Framework + control mappings
  // ======================================================================
  app.put('/assessments/templates/:id/questions/:qid/framework-mappings', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id, qid } = req.params as { id: string; qid: string };
    const b = req.body as { mappings: FrameworkMappingInput[] };
    return assessmentService.setFrameworkMappings(auth.org, id, qid, b.mappings, auth.sub);
  });
  app.get('/assessments/templates/:id/framework-mappings', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listFrameworkMappings(auth.org, id);
  });
  app.put('/assessments/templates/:id/questions/:qid/control-mappings', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id, qid } = req.params as { id: string; qid: string };
    const b = req.body as { mappings: ControlMappingInput[] };
    return assessmentService.setControlMappings(auth.org, id, qid, b.mappings, auth.sub);
  });
  app.get('/assessments/templates/:id/control-mappings', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listControlMappings(auth.org, id);
  });

  // ======================================================================
  // Library
  // ======================================================================
  app.get('/assessments/library', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string>;
    return assessmentService.library(auth.org, {
      search: q.search, type: q.type as any, categoryId: q.categoryId, status: q.status as any,
      tag: q.tag, framework: q.framework, industry: q.industry, factory: q.factory,
      organizationId: q.organizationId, version: q.version ? parseInt(q.version, 10) : undefined,
      sort: q.sort, order: q.order as any, page: q.page ? parseInt(q.page, 10) : 1, pageSize: q.pageSize ? parseInt(q.pageSize, 10) : 20,
    });
  });
  app.get('/assessments/library/:id', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.getTemplateWithStructure(auth.org, id);
  });
  app.get('/assessments/search', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { q?: string };
    return assessmentService.searchWithin(auth.org, q.q ?? '');
  });

  // ======================================================================
  // Runtime — assessments
  // ======================================================================
  app.get('/assessments', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string>;
    return assessmentService.listAssessments(auth.org, {
      search: q.search, type: q.type as any, categoryId: q.categoryId, status: q.status as any,
      sort: q.sort, order: q.order as any, page: q.page ? parseInt(q.page, 10) : 1, pageSize: q.pageSize ? parseInt(q.pageSize, 10) : 20,
    });
  });
  app.post('/assessments', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as any;
    return assessmentService.createAssessment(auth.org, b, auth.sub);
  });
  app.get('/assessments/:id', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.getAssessment(auth.org, id);
  });
  app.patch('/assessments/:id', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.updateAssessment(auth.org, id, req.body as any, auth.sub);
  });
  app.delete('/assessments/:id', { preHandler: del }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await assessmentService.deleteAssessment(auth.org, id, auth.sub);
    return { success: true };
  });

  // Responses + scoring
  app.get('/assessments/:id/responses', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listResponses(auth.org, id);
  });
  app.post('/assessments/:id/responses', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { questionId: string } & Record<string, unknown>;
    return assessmentService.submitResponse(auth.org, id, b.questionId, b, auth.sub);
  });
  app.get('/assessments/:id/scores', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listScores(auth.org, id);
  });
  app.post('/assessments/:id/scores/recompute', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await assessmentService.recomputeAssessmentScores(auth.org, id);
    return { success: true };
  });

  // ======================================================================
  // Workflow — assignments, reviews, approvals, comments, attachments
  // ======================================================================
  app.post('/assessments/:id/assignments', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.createAssignment(auth.org, id, req.body as any, auth.sub);
  });
  app.get('/assessments/:id/assignments', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listAssignments(auth.org, id);
  });
  app.patch('/assessments/:id/assignments/:aid', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id, aid } = req.params as { id: string; aid: string };
    return assessmentService.updateAssignment(auth.org, id, aid, req.body as any);
  });

  app.post('/assessments/:id/reviews', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.createReview(auth.org, id, req.body as any, auth.sub);
  });
  app.get('/assessments/:id/reviews', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listReviews(auth.org, id);
  });
  app.patch('/assessments/:id/reviews/:rid', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id, rid } = req.params as { id: string; rid: string };
    return assessmentService.updateReview(auth.org, id, rid, req.body as any);
  });

  app.post('/assessments/:id/approvals', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.createApproval(auth.org, id, req.body as any, auth.sub);
  });
  app.get('/assessments/:id/approvals', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listApprovals(auth.org, id);
  });
  app.patch('/assessments/:id/approvals/:apid', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id, apid } = req.params as { id: string; apid: string };
    return assessmentService.updateApproval(auth.org, id, apid, req.body as any);
  });

  app.post('/assessments/:id/comments', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const b = req.body as { body: string; kind?: string; scope?: string; targetId?: string | null; parentCommentId?: string | null };
    return assessmentService.createComment(auth.org, id, b, auth.sub);
  });
  app.get('/assessments/:id/comments', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listComments(auth.org, id);
  });
  app.post('/assessments/:id/comments/:cid/resolve', { preHandler: update }, async (req) => {
    const auth = getAuth(req);
    const { id, cid } = req.params as { id: string; cid: string };
    const b = req.body as { resolved?: boolean };
    return assessmentService.resolveComment(auth.org, id, cid, b?.resolved ?? true);
  });

  app.post('/assessments/:id/attachments', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.createAttachment(auth.org, id, req.body as any, auth.sub);
  });
  app.get('/assessments/:id/attachments', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return assessmentService.listAttachments(auth.org, id);
  });

  // ======================================================================
  // Schedule placeholders
  // ======================================================================
  app.post('/assessments/schedule-placeholders', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.createSchedulePlaceholder(auth.org, req.body as any);
  });
  app.get('/assessments/schedule-placeholders', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return assessmentService.listSchedulePlaceholders(auth.org);
  });
}
