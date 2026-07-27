import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { responsibleSourcingService } from '../services/responsible-sourcing.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const materialCreateSchema = z.object({
  supplierId: z.string().uuid(),
  materialName: z.string().min(1),
  materialCategory: z.enum(['raw_material', 'conflict_mineral', 'palm_oil', 'cotton', 'timber', 'recycled_material', 'mineral', 'chemical', 'component', 'other']),
  countryOfOrigin: z.string().optional(),
  traceabilityId: z.string().optional(),
  traceabilityStatus: z.enum(['unknown', 'partial', 'full', 'unverified']).optional(),
    supplyChainMapping: z.array(z.record(z.string(), z.unknown())).default([]),
  certifyingBody: z.string().optional(),
  certificationStatus: z.string().optional(),
  chainOfCustody: z.enum(['not_verified', 'in_progress', 'verified', 'suspended', 'revoked']).optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
});

export async function responsibleSourcingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers/materials', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { supplierId?: string; materialCategory?: string; countryOfOrigin?: string };
    const materials = await responsibleSourcingService.listMaterials(auth.org, q.supplierId, { materialCategory: q.materialCategory, countryOfOrigin: q.countryOfOrigin });
    return { materials, total: materials.length };
  });

  app.get('/suppliers/materials/:id', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return responsibleSourcingService.getMaterial(id, auth.org);
  });

  app.post('/suppliers/materials', { preHandler: requirePermission('suppliers:write'), schema: { body: materialCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof materialCreateSchema>;
    return responsibleSourcingService.createMaterial(auth.org, body.supplierId, body as any, auth.sub);
  });

  app.put('/suppliers/materials/:id', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{ materialName: string; materialCategory: string; countryOfOrigin: string; traceabilityId: string; traceabilityStatus: string; supplyChainMapping: unknown[]; certifyingBody: string; certificationStatus: string; chainOfCustody: string; quantity: number; unit: string }>;
    return responsibleSourcingService.updateMaterial(id, auth.org, body as any, auth.sub);
  });

  app.delete('/suppliers/materials/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await responsibleSourcingService.deleteMaterial(id, auth.org, auth.sub);
    return { success: true };
  });

  app.get('/suppliers/sourcing-summary', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return responsibleSourcingService.getSourcingSummary(auth.org);
  });
}