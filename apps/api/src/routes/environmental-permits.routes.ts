import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentalPermitsService } from '../services/environmental-permits.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const permitCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  permitType: z.enum(['water','air','waste','chemical','environmental_approval','discharge','emission','storage','transport','other']),
  permitNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  issueDate: z.string().min(1),
  expiryDate: z.string().min(1),
  renewalDate: z.string().optional(),
  status: z.enum(['active','expired','pending','revoked','suspended','renewed']).default('active'),
  conditions: z.string().optional(),
  supportingDocuments: z.array(z.string()).default([]),
  approvalHistory: z.array(z.record(z.string(), z.unknown())).default([]),
  responsiblePersonId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

const permitUpdateSchema = permitCreateSchema.partial();

export async function environmentalPermitsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/environmental-permits', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalPermitsService.list(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/environmental-permits/renewals', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return environmentalPermitsService.getUpcomingRenewals(auth.org, q.days ? Number(q.days) : 30);
  });

  app.get('/environmental-permits/expired', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalPermitsService.getExpired(auth.org);
  });

  app.get('/environmental-permits/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalPermitsService.get(auth.org, id);
  });

  app.post('/environmental-permits', { preHandler: requirePermission('environment:create'), schema: { body: permitCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentalPermitsService.create(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/environmental-permits/:id', { preHandler: requirePermission('environment:update'), schema: { body: permitUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalPermitsService.update(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/environmental-permits/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalPermitsService.delete(auth.org, id, auth.sub);
  });
}
