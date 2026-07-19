import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { caseService } from '../services/case.service.js';
import { createInvestigation, getInvestigation, updateInvestigation, assignInvestigator, unassignInvestigator, listAssignments, getTimeline, getWorkload, listInvestigators } from '../services/investigation.service.js';
import { escalateCase, getEscalationHistory } from '../services/escalation.service.js';
import { calculateRiskScore, getRiskScore } from '../services/risk.service.js';
import { caseRepo } from '../repositories/case.repo.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const caseCreateSchema = z.object({
  grievanceId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  source: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  reporterAnonymous: z.boolean().optional(),
  factoryId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  country: z.string().nullable().optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  slaDeadline: z.string().datetime().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

const caseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['open', 'under_investigation', 'escalated', 'pending_review', 'resolved', 'closed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  reporterAnonymous: z.boolean().optional(),
  factoryId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  country: z.string().nullable().optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  slaDeadline: z.string().datetime().nullable().optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  mergedInto: z.string().uuid().nullable().optional(),
  duplicateOf: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

const commentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

const noteSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

const responseSchema = z.object({
  body: z.string().min(1),
});

const evidenceSchema = z.object({
  filename: z.string().min(1),
  originalFilename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  storagePath: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['image', 'document', 'video', 'audio', 'other']).optional(),
  tags: z.array(z.string()).optional(),
});

const witnessSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['witness', 'victim', 'bystander', 'expert']).optional(),
  statement: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  protectionLevel: z.enum(['standard', 'elevated', 'protected']).optional(),
});

const interviewSchema = z.object({
  witnessId: z.string().uuid().nullable().optional(),
  type: z.enum(['verbal', 'written', 'video', 'audio', 'forensic']).optional(),
  location: z.string().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  summary: z.string().min(1),
  transcript: z.string().optional(),
  recordingPath: z.string().optional(),
  findings: z.string().optional(),
  isConfidential: z.boolean().optional(),
});

const findingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  confidence: z.enum(['low', 'medium', 'high', 'confirmed']).optional(),
  evidenceIds: z.array(z.string().uuid()).optional(),
  isFinal: z.boolean().optional(),
});

const rootCauseSchema = z.object({
  category: z.enum(['people', 'process', 'technology', 'environment', 'policy', 'training']),
  description: z.string().min(1),
  contributingFactors: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  verificationMethod: z.string().optional(),
});

const resolutionSchema = z.object({
  type: z.enum(['corrective', 'disciplinary', 'policy_change', 'training', 'compensation', 'warning', 'termination', 'other']),
  description: z.string().min(1),
  actionsTaken: z.string().min(1),
  preventiveMeasures: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  implementedAt: z.string().datetime().nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  verifiedBy: z.string().uuid().nullable().optional(),
  isFinal: z.boolean().optional(),
});

const investigationUpdateSchema = z.object({
  leadInvestigator: z.string().uuid().nullable().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'suspended']).optional(),
  scope: z.string().optional(),
  methodology: z.string().optional(),
  findingsSummary: z.string().optional(),
  conclusion: z.string().optional(),
});

const assignmentSchema = z.object({
  investigatorId: z.string().uuid(),
  role: z.enum(['lead', 'investigator', 'reviewer', 'observer']).optional(),
  notes: z.string().optional(),
});

const linkSchema = z.object({
  relatedCaseId: z.string().uuid(),
  linkType: z.enum(['related', 'duplicate', 'parent', 'child', 'follow_up']).optional(),
});

const filterSchema = z.object({
  name: z.string().min(1),
  filters: z.record(z.any()),
  isShared: z.boolean().optional(),
});

export async function caseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Cases ----
  app.get('/cases', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as {
      status?: string;
      priority?: string;
      category?: string;
      source?: string;
      factoryId?: string;
      departmentId?: string;
      assignedTo?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      labels?: string;
      tags?: string;
      limit?: string;
      offset?: string;
      sortBy?: string;
      sortOrder?: string;
    };
    const assignedToArr = q.assignedTo ? q.assignedTo.split(',') : undefined;
    const labelsArr = q.labels ? q.labels.split(',') : undefined;
    const tagsArr = q.tags ? q.tags.split(',') : undefined;
    return caseService.listCases(auth.org, {
      status: q.status,
      priority: q.priority,
      category: q.category,
      source: q.source,
      factoryId: q.factoryId,
      departmentId: q.departmentId,
      assignedTo: assignedToArr,
      search: q.search,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      labels: labelsArr,
      tags: tagsArr,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder,
    });
  });

  app.get('/cases/stats', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as {
      status?: string;
      priority?: string;
      category?: string;
      source?: string;
      factoryId?: string;
      departmentId?: string;
      assignedTo?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      labels?: string;
      tags?: string;
    };
    const assignedToArr = q.assignedTo ? q.assignedTo.split(',') : undefined;
    const labelsArr = q.labels ? q.labels.split(',') : undefined;
    const tagsArr = q.tags ? q.tags.split(',') : undefined;
    return caseService.getCaseStats(auth.org, {
      status: q.status,
      priority: q.priority,
      category: q.category,
      source: q.source,
      factoryId: q.factoryId,
      departmentId: q.departmentId,
      assignedTo: assignedToArr,
      search: q.search,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      labels: labelsArr,
      tags: tagsArr,
    });
  });

  app.post('/cases', { preHandler: requirePermission('case:create'), schema: { body: caseCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof caseCreateSchema>;
    const case_ = await caseService.createCase({
      organizationId: auth.org,
      grievanceId: body.grievanceId ?? null,
      title: body.title,
      description: body.description,
      category: body.category,
      source: body.source,
      priority: body.priority,
      severity: body.severity,
      reporterName: body.reporterName,
      reporterEmail: body.reporterEmail,
      reporterPhone: body.reporterPhone,
      reporterAnonymous: body.reporterAnonymous,
      factoryId: body.factoryId,
      departmentId: body.departmentId,
      country: body.country,
      assignedTo: body.assignedTo,
      labels: body.labels,
      tags: body.tags,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : null,
      metadata: body.metadata,
    }, auth.sub);
    return case_;
  });

  app.get('/cases/:id', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return caseService.getCase(auth.org, id);
  });

  app.patch('/cases/:id', { preHandler: requirePermission('case:update'), schema: { body: caseUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof caseUpdateSchema>;
    const patch: Record<string, unknown> = { ...body };
    if (patch.dueDate !== undefined && patch.dueDate !== null) patch.dueDate = new Date(patch.dueDate as string);
    if (patch.slaDeadline !== undefined && patch.slaDeadline !== null) patch.slaDeadline = new Date(patch.slaDeadline as string);
    return caseService.updateCase(auth.org, id, patch, auth.sub);
  });

  app.delete('/cases/:id', { preHandler: requirePermission('case:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await caseService.deleteCase(auth.org, id, auth.sub);
    return { success: true };
  });

  app.post('/cases/:id/restore', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await caseService.restoreCase(auth.org, id, auth.sub);
    return { success: true };
  });

  app.post('/cases/:id/merge', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { sourceIds } = req.body as { sourceIds: string[] };
    await caseService.mergeCases(auth.org, id, sourceIds);
    return { success: true };
  });

  app.get('/cases/:id/duplicates', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return caseService.findDuplicates(auth.org, id);
  });

  app.post('/cases/:id/tags', { preHandler: requirePermission('case:update'), schema: { body: z.object({ tag: z.string().min(1) }) } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { tag } = req.body as { tag: string };
    return caseService.addTag(auth.org, id, tag);
  });

  app.delete('/cases/:id/tags/:tag', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id, tag } = req.params as { id: string; tag: string };
    await caseService.removeTag(auth.org, id, tag);
    return { success: true };
  });

  app.post('/cases/:id/labels', { preHandler: requirePermission('case:update'), schema: { body: z.object({ label: z.string().min(1) }) } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { label } = req.body as { label: string };
    return caseService.addLabel(auth.org, id, label);
  });

  app.delete('/cases/:id/labels/:label', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id, label } = req.params as { id: string; label: string };
    await caseService.removeLabel(auth.org, id, label);
    return { success: true };
  });

  app.post('/cases/:id/watchers', { preHandler: requirePermission('case:update'), schema: { body: z.object({ userId: z.string().uuid() }) } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { userId } = req.body as { userId: string };
    return caseService.addWatcher(auth.org, id, userId);
  });

  app.delete('/cases/:id/watchers/:userId', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id, userId } = req.params as { id: string; userId: string };
    await caseService.removeWatcher(auth.org, id, userId);
    return { success: true };
  });

  app.post('/cases/:id/assign', { preHandler: requirePermission('case:assign'), schema: { body: z.object({ userId: z.string().uuid() }) } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { userId } = req.body as { userId: string };
    return caseService.assignCase(auth.org, id, userId);
  });

  app.delete('/cases/:id/assign/:userId', { preHandler: requirePermission('case:assign') }, async (req) => {
    const auth = getAuth(req);
    const { id, userId } = req.params as { id: string; userId: string };
    await caseService.unassignCase(auth.org, id, userId);
    return { success: true };
  });

  app.post('/cases/:id/comments', { preHandler: requirePermission('case:update'), schema: { body: commentSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof commentSchema>;
    return caseService.addComment(auth.org, id, auth.sub, body.body, body.isInternal ?? true, (body.parentId ?? null) as null);
  });

  app.patch('/cases/:id/comments/:commentId', { preHandler: requirePermission('case:update'), schema: { body: z.object({ body: z.string().min(1) }) } }, async (req) => {
    const auth = getAuth(req);
    const { id, commentId } = req.params as { id: string; commentId: string };
    const { body } = req.body as { body: string };
    return caseService.updateComment(auth.org, id, commentId, body);
  });

  app.delete('/cases/:id/comments/:commentId', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id, commentId } = req.params as { id: string; commentId: string };
    await caseService.deleteComment(auth.org, id, commentId);
    return { success: true };
  });

  app.post('/cases/:id/notes', { preHandler: requirePermission('case:update'), schema: { body: noteSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof noteSchema>;
    return caseService.addInternalNote(auth.org, id, auth.sub, body.title, body.body);
  });

  app.post('/cases/:id/responses', { preHandler: requirePermission('case:update'), schema: { body: responseSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { body } = req.body as z.infer<typeof responseSchema>;
    return caseService.addPublicResponse(auth.org, id, auth.sub, body);
  });

  app.post('/cases/:id/evidence', { preHandler: requirePermission('case:update'), schema: { body: evidenceSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof evidenceSchema>;
    return caseService.addEvidence(auth.org, id, body);
  });

  app.get('/cases/:id/evidence', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return caseService.getEvidence(auth.org, id);
  });

  app.post('/cases/:id/witnesses', { preHandler: requirePermission('case:update'), schema: { body: witnessSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof witnessSchema>;
    return caseService.addWitness(auth.org, id, body);
  });

  app.post('/cases/:id/interviews', { preHandler: requirePermission('case:update'), schema: { body: interviewSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof interviewSchema>;
    return caseService.addInterview(auth.org, id, body);
  });

  app.post('/cases/:id/findings', { preHandler: requirePermission('case:update'), schema: { body: findingSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof findingSchema>;
    return caseService.addFinding(auth.org, id, body);
  });

  app.post('/cases/:id/root-causes', { preHandler: requirePermission('case:update'), schema: { body: rootCauseSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof rootCauseSchema>;
    return caseService.addRootCause(auth.org, id, body);
  });

  app.post('/cases/:id/resolutions', { preHandler: requirePermission('case:update'), schema: { body: resolutionSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof resolutionSchema>;
    const patch: Record<string, unknown> = { ...body };
    if (patch.implementedAt !== undefined && patch.implementedAt !== null) patch.implementedAt = new Date(patch.implementedAt as string);
    if (patch.verifiedAt !== undefined && patch.verifiedAt !== null) patch.verifiedAt = new Date(patch.verifiedAt as string);
    return caseService.addResolution(auth.org, id, patch);
  });

  app.post('/cases/:id/links', { preHandler: requirePermission('case:update'), schema: { body: linkSchema } }, async (req) => {
    const { id } = req.params as { id: string };
    const { relatedCaseId, linkType } = req.body as z.infer<typeof linkSchema>;
    return caseRepo.linkCase(id, relatedCaseId, linkType ?? 'related');
  });

  app.delete('/cases/:id/links/:relatedCaseId', { preHandler: requirePermission('case:update') }, async (req) => {
    const { id, relatedCaseId } = req.params as { id: string; relatedCaseId: string };
    await caseRepo.unlinkCase(id, relatedCaseId, 'related');
    return { success: true };
  });

  app.post('/cases/:id/bulk', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { action: 'delete' | 'restore' | 'archive' };
    if (body.action === 'delete') await caseService.deleteCase(auth.org, id, auth.sub);
    else if (body.action === 'restore') await caseService.restoreCase(auth.org, id, auth.sub);
    else if (body.action === 'archive') {
      await caseService.updateCase(auth.org, id, { status: 'archived' }, auth.sub);
    }
    return { success: true };
  });

  app.post('/cases/bulk', { preHandler: requirePermission('case:update') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as { caseIds: string[]; patch: Record<string, unknown> };
    await caseService.bulkUpdate(auth.org, body.caseIds, body.patch, auth.sub);
    return { success: true };
  });

  app.post('/cases/:id/saved-filters', { preHandler: requirePermission('case:update'), schema: { body: filterSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof filterSchema>;
    return caseRepo.saveFilter(auth.org, auth.sub, body.name, body.filters, body.isShared ?? false);
  });

  app.get('/cases/saved-filters', { preHandler: requirePermission('case:read') }, async (req) => {
    const auth = getAuth(req);
    return caseRepo.listSavedFilters(auth.org, auth.sub);
  });

  // ---- Investigations ----
  app.post('/cases/:id/investigations', { preHandler: requirePermission('investigation:create') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const investigation = await createInvestigation(id, null, auth.sub);
    return investigation;
  });

  app.get('/cases/:id/investigations', { preHandler: requirePermission('investigation:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return getInvestigation(id);
  });

  app.patch('/cases/:id/investigations', { preHandler: requirePermission('investigation:update'), schema: { body: investigationUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof investigationUpdateSchema>;
    return updateInvestigation(id, body, auth.sub);
  });

  app.get('/cases/:id/investigations/assignments', { preHandler: requirePermission('investigation:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return listAssignments(id);
  });

  app.post('/cases/:id/investigations/assignments', { preHandler: requirePermission('investigation:assign'), schema: { body: assignmentSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof assignmentSchema>;
    return assignInvestigator(id, body.investigatorId, auth.sub, body.role ?? 'investigator', (body.notes ?? null) as null);
  });

  app.delete('/cases/:id/investigations/assignments/:investigatorId', { preHandler: requirePermission('investigation:assign') }, async (req) => {
    const { id, investigatorId } = req.params as { id: string; investigatorId: string };
    await unassignInvestigator(id, investigatorId);
    return { success: true };
  });

  app.get('/cases/:id/investigations/timeline', { preHandler: requirePermission('investigation:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return getTimeline(id);
  });

  app.get('/investigations/workload', { preHandler: requirePermission('investigation:read') }, async (req) => {
    const auth = getAuth(req);
    return getWorkload(auth.org);
  });

  app.get('/investigators', { preHandler: requirePermission('investigation:read') }, async (req) => {
    const auth = getAuth(req);
    return listInvestigators(auth.org);
  });

  // ---- Escalation ----
  app.post('/cases/:id/escalate', { preHandler: requirePermission('escalation:create') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { ruleId?: string | null; escalatedTo?: string | null; reason: string };
    return escalateCase(id, body.ruleId ?? null, body.escalatedTo ?? null, body.reason, auth.sub);
  });

  app.get('/cases/:id/escalation-history', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return getEscalationHistory(id);
  });

  // ---- Risk ----
  app.post('/cases/:id/risk/calculate', { preHandler: requirePermission('risk:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return calculateRiskScore(id);
  });

  app.get('/cases/:id/risk', { preHandler: requirePermission('risk:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return getRiskScore(id);
  });
}
