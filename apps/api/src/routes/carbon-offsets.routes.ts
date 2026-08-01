import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { carbonService } from '../services/carbon.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const offsetCreateSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  offsetType: z.enum(['carbon_credit', 'verified_carbon', 'gold_standard', 'other']),
  registry: z.string().optional(),
  registryId: z.string().optional(),
  creditsPurchased: z.number(),
  creditsRetired: z.number().optional(),
  purchaseDate: z.string().min(1),
  expiryDate: z.string().optional(),
  costPerTon: z.number().optional(),
  totalCost: z.number().optional(),
  certificateUrl: z.string().url().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  verifiedBy: z.string().uuid().nullable().optional(),
});

const offsetUpdateSchema = offsetCreateSchema.partial();

export async function carbonOffsetsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/carbon-offsets', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listCarbonOffsets(auth.org, {
      projectId: q.projectId,
      offsetType: q.offsetType,
    });
  });

  app.get('/carbon-offsets/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getCarbonOffset(auth.org, id);
  });

  app.post('/carbon-offsets', { preHandler: requirePermission('sustainability:create'), schema: { body: offsetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createCarbonOffset(auth.org, req.body as Record<string, unknown>);
  });

  app.patch('/carbon-offsets/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: offsetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateCarbonOffset(auth.org, id, req.body as Partial<Record<string, unknown>>);
  });

  app.delete('/carbon-offsets/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteCarbonOffset(auth.org, id);
  });
}

