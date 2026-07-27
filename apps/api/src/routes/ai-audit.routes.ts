import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { aiAuditService } from '../modules/ai-audit/index.js';

export async function aiAuditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  const createSessionSchema = z.object({
    auditId: z.string().uuid().optional(),
    mode: z.string().min(1),
  });

  app.post('/ai/audit/sessions', { preHandler: requirePermission('ai:update'), schema: { body: createSessionSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof createSessionSchema>;
    return aiAuditService.createSession(auth.org, body.auditId ?? null, auth.sub, body.mode);
  });

  app.get('/ai/audit/sessions', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return aiAuditService.listSessions(auth.org);
  });

  app.get('/ai/audit/sessions/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return aiAuditService.getSession(id);
  });

  const updateSessionSchema = z.object({
    status: z.string().optional(),
    context: z.record(z.any()).optional(),
    result: z.record(z.any()).optional(),
  });

  app.patch('/ai/audit/sessions/:id', { preHandler: requirePermission('ai:update'), schema: { body: updateSessionSchema } }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof updateSessionSchema>;
    return aiAuditService.updateSession(id, body);
  });

  const generateChecklistSchema = z.object({
    auditId: z.string().uuid().optional(),
    prompt: z.string().min(1),
  });

  app.post('/ai/audit/sessions/:id/checklist', { preHandler: requirePermission('ai:update'), schema: { body: generateChecklistSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof generateChecklistSchema>;
    return aiAuditService.generateChecklist(auth.org, id, body.auditId ?? null, body.prompt);
  });

  const generateFindingsSchema = z.object({
    auditId: z.string().uuid().optional(),
    context: z.record(z.any()),
  });

  app.post('/ai/audit/sessions/:id/findings', { preHandler: requirePermission('ai:update'), schema: { body: generateFindingsSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof generateFindingsSchema>;
    return aiAuditService.generateFindings(auth.org, id, body.auditId ?? null, body.context);
  });

  const assistInterviewSchema = z.object({
    question: z.string().min(1),
    context: z.record(z.any()),
  });

  app.post('/ai/audit/sessions/:id/interview', { preHandler: requirePermission('ai:update'), schema: { body: assistInterviewSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof assistInterviewSchema>;
    return aiAuditService.assistInterview(auth.org, id, body.question, body.context);
  });

  const generateReportSchema = z.object({
    auditId: z.string().uuid().optional(),
    type: z.string().min(1),
  });

  app.post('/ai/audit/sessions/:id/report', { preHandler: requirePermission('ai:update'), schema: { body: generateReportSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof generateReportSchema>;
    return aiAuditService.generateReport(auth.org, id, body.auditId ?? null, body.type);
  });

  const planAuditSchema = z.object({
    auditId: z.string().uuid().optional(),
    scope: z.string().min(1),
  });

  app.post('/ai/audit/sessions/:id/plan', { preHandler: requirePermission('ai:update'), schema: { body: planAuditSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof planAuditSchema>;
    return aiAuditService.planAudit(auth.org, id, body.auditId ?? null, body.scope);
  });

  const reviewDocumentSchema = z.object({
    documentId: z.string().uuid(),
  });

  app.post('/ai/audit/sessions/:id/review-document', { preHandler: requirePermission('ai:update'), schema: { body: reviewDocumentSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof reviewDocumentSchema>;
    return aiAuditService.reviewDocument(auth.org, id, body.documentId);
  });
}
