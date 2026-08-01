import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { supplierCarbonService } from '../services/supplier-carbon.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const carbonRecordCreateSchema = z.object({
  supplierId: z.string().uuid(),
  scope: z.enum(['scope_1', 'scope_2', 'scope_3']),
  category: z.string().optional(),
  emissionValue: z.number().optional(),
  unit: z.string().optional(),
  energyConsumption: z.number().optional(),
  energyUnit: z.string().optional(),
  renewableEnergy: z.boolean().optional(),
  renewablePercentage: z.number().optional(),
  wasteGenerated: z.number().optional(),
  wasteUnit: z.string().optional(),
  waterConsumption: z.number().optional(),
  waterUnit: z.string().optional(),
  reductionProject: z.string().optional(),
  targetValue: z.number().optional(),
  targetYear: z.number().int().optional(),
  baselineValue: z.number().optional(),
  emissionDate: z.string().optional(),
  reportingPeriod: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const carbonRecordUpdateSchema = carbonRecordCreateSchema.partial();

const carbonTargetCreateSchema = z.object({
  supplierId: z.string().uuid(),
  scope: z.enum(['scope_1', 'scope_2', 'scope_3']),
  targetValue: z.number(),
  baselineValue: z.number(),
  unit: z.string().optional(),
  targetYear: z.number().int(),
  status: z.enum(['not_started', 'in_progress', 'achieved', 'missed']).optional(),
});

const carbonTargetUpdateSchema = carbonTargetCreateSchema.partial();

export async function supplierCarbonRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Dashboard ----
  app.get('/suppliers/carbon/dashboard', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return supplierCarbonService.getDashboard(auth.org);
  });

  // ---- Reduction projects aggregate ----
  app.get('/suppliers/carbon/projects', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return supplierCarbonService.getProjects(auth.org);
  });

  // ---- Targets ----
  app.get('/suppliers/carbon/targets', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return supplierCarbonService.listTargets(auth.org, q.supplierId);
  });

  app.post('/suppliers/carbon/targets', { preHandler: requirePermission('suppliers:create'), schema: { body: carbonTargetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return supplierCarbonService.createTarget(auth.org, req.body as z.infer<typeof carbonTargetCreateSchema>, auth.sub);
  });

  app.put('/suppliers/carbon/targets/:id', { preHandler: requirePermission('suppliers:write'), schema: { body: carbonTargetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierCarbonService.updateTarget(id, auth.org, req.body as Partial<z.infer<typeof carbonTargetUpdateSchema>>, auth.sub);
  });

  app.delete('/suppliers/carbon/targets/:id', { preHandler: requirePermission('suppliers:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierCarbonService.deleteTarget(id, auth.org, auth.sub);
    return { success: true };
  });

  // ---- Carbon Records ----
  app.get('/suppliers/carbon', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return supplierCarbonService.listRecords(auth.org, {
      supplierId: q.supplierId,
      scope: q.scope,
      category: q.category,
      reportingPeriod: q.reportingPeriod,
      search: q.search,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });
  });

  app.post('/suppliers/carbon', { preHandler: requirePermission('suppliers:create'), schema: { body: carbonRecordCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return supplierCarbonService.createRecord(auth.org, req.body as z.infer<typeof carbonRecordCreateSchema>, auth.sub);
  });

  app.get('/suppliers/carbon/:id', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierCarbonService.getRecord(id, auth.org);
  });

  app.put('/suppliers/carbon/:id', { preHandler: requirePermission('suppliers:write'), schema: { body: carbonRecordUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierCarbonService.updateRecord(id, auth.org, req.body as Partial<z.infer<typeof carbonRecordCreateSchema>>, auth.sub);
  });

  app.delete('/suppliers/carbon/:id', { preHandler: requirePermission('suppliers:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierCarbonService.deleteRecord(id, auth.org, auth.sub);
    return { success: true };
  });
}

