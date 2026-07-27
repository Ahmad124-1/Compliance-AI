import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { certificationService } from '../services/certifications.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const certificationCreateSchema = z.object({
  supplierId: z.string().uuid(),
  certificationName: z.string().min(1),
  certificationType: z.enum(['iso_14001', 'iso_45001', 'iso_9001', 'sa8000', 'smeta', 'bsci', 'wrap', 'fsc', 'fairtrade', 'rainforest_alliance', 'organic', 'custom']),
  certificationBody: z.string().optional(),
  certificateNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  renewalDate: z.string().optional(),
  scope: z.string().optional(),
  notes: z.string().optional(),
});

export async function certificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers/certifications', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { supplierId?: string; certificationType?: string; status?: string };
    const certifications = await certificationService.listCertifications(auth.org, q.supplierId, { certificationType: q.certificationType, status: q.status });
    return { certifications, total: certifications.length };
  });

  app.get('/suppliers/certifications/expiring', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { daysAhead?: string };
    const days = q.daysAhead ? parseInt(q.daysAhead, 10) : 90;
    return certificationService.getExpiringCertifications(auth.org, days);
  });

  app.get('/suppliers/certifications/:id', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return certificationService.getCertification(id, auth.org);
  });

  app.post('/suppliers/certifications', { preHandler: requirePermission('suppliers:write'), schema: { body: certificationCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof certificationCreateSchema>;
    return certificationService.createCertification(auth.org, body.supplierId, body, auth.sub);
  });

  app.put('/suppliers/certifications/:id/verify', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { status: string };
    return certificationService.verifyCertification(id, auth.org, body.status, auth.sub);
  });

  app.put('/suppliers/certifications/:id/status', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { status: string };
    return certificationService.updateCertificationStatus(id, auth.org, body.status, auth.sub);
  });

  app.delete('/suppliers/certifications/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await certificationService.deleteCertification(id, auth.org, auth.sub);
    return { success: true };
  });
}