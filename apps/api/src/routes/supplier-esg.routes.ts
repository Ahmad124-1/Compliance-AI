import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { supplierEsgService } from '../services/supplier-esg.service.js';
import type { AssessmentAnswer } from '../modules/supplier-esg/types.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const assessmentCreateSchema = z.object({
  supplierId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['environmental', 'social', 'governance', 'health_safety', 'ethics', 'responsible_sourcing', 'labor_rights', 'human_rights', 'anti_corruption', 'data_privacy']),
  questions: z.array(z.record(z.string(), z.unknown())).default([]),
  dueDate: z.string().optional(),
});

const assessmentSubmitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    score: z.number().min(0),
    maxScore: z.number().min(1),
    evidence: z.string().optional(),
    notes: z.string().optional(),
  })),
});

const assessmentReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  reviewerId: z.string().uuid().optional(),
  reviewerName: z.string().optional(),
  notes: z.string().optional(),
});

export async function supplierEsgRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers/assessments', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { supplierId?: string; category?: string; status?: string; limit?: string; offset?: string };
    const assessments = await supplierEsgService.listAssessments(auth.org, q.supplierId);
    return { assessments, total: assessments.length };
  });

  app.get('/suppliers/assessments/:id', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierEsgService.getAssessment(id, auth.org);
  });

  app.post('/suppliers/assessments', { preHandler: requirePermission('suppliers:write'), schema: { body: assessmentCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof assessmentCreateSchema>;
    const assessment = await supplierEsgService.createAssessment(auth.org, body.supplierId, body as any, auth.sub);
    return assessment;
  });

  app.post('/suppliers/assessments/:id/submit', { preHandler: requirePermission('suppliers:write'), schema: { body: assessmentSubmitSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof assessmentSubmitSchema>;
    return supplierEsgService.submitAssessment(id, auth.org, body.answers as AssessmentAnswer[], auth.sub);
  });

  app.post('/suppliers/assessments/:id/review', { preHandler: requirePermission('suppliers:write'), schema: { body: assessmentReviewSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof assessmentReviewSchema>;
    return supplierEsgService.reviewAssessment(id, auth.org, body.action, body.reviewerId, body.reviewerName, body.notes, auth.sub);
  });

  app.get('/suppliers/:supplierId/assessments/summary', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const { supplierId } = req.params as { supplierId: string };
    return supplierEsgService.getAssessmentSummary(auth.org, supplierId);
  });

  app.delete('/suppliers/assessments/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierEsgService.deleteAssessment(id, auth.org, auth.sub);
    return { success: true };
  });
}