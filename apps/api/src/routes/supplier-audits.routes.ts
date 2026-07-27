import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { supplierAuditService } from '../services/supplier-audits.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const auditCreateSchema = z.object({
  supplierId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  auditType: z.enum(['desktop', 'remote', 'onsite', 'third_party', 'follow_up']),
  auditorId: z.string().uuid().optional(),
  auditorName: z.string().optional(),
  auditDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function supplierAuditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers/audits', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { supplierId?: string; auditType?: string; status?: string };
    const audits = await supplierAuditService.listAudits(auth.org, q.supplierId);
    return { audits, total: audits.length };
  });

  app.get('/suppliers/audits/:id', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierAuditService.getAudit(id, auth.org);
  });

  app.post('/suppliers/audits', { preHandler: requirePermission('suppliers:write'), schema: { body: auditCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof auditCreateSchema>;
    return supplierAuditService.createAudit(auth.org, body.supplierId, body, auth.sub);
  });

  app.post('/suppliers/audits/:id/status', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { status: string };
    return supplierAuditService.updateAuditStatus(id, auth.org, body.status, auth.sub);
  });

  app.post('/suppliers/audits/:id/findings', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { title: string; description: string; severity: string; status?: string };
    return supplierAuditService.addFinding(id, auth.org, body as any, auth.sub);
  });

  app.post('/suppliers/audits/:id/evidence', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { title: string; type: string; url?: string; description?: string };
    return supplierAuditService.addEvidence(id, auth.org, body as any, auth.sub);
  });

  app.post('/suppliers/audits/:id/approvals', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { reviewerType: string; reviewerId?: string; reviewerName?: string; status?: string; notes?: string };
    return supplierAuditService.addApproval(id, auth.org, body as any, auth.sub);
  });

  app.delete('/suppliers/audits/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierAuditService.deleteAudit(id, auth.org, auth.sub);
    return { success: true };
  });
}