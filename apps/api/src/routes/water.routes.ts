import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { waterService } from '../services/water.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const waterCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  sourceType: z.enum(['ground_water','municipal','rainwater','recycled','surface_water','other']),
  consumptionDate: z.string().min(1),
  consumptionAmount: z.number(),
  unit: z.string().default('m3'),
  dischargeAmount: z.number().nullable().optional(),
  dischargeQuality: z.string().optional(),
  treatmentMethod: z.string().optional(),
  reuseAmount: z.number().default(0),
  leakDetected: z.boolean().default(false),
  leakDetails: z.string().optional(),
  waterIntensity: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

const waterUpdateSchema = waterCreateSchema.partial();

const targetCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetType: z.enum(['reduction','intensity','reuse','recycling','discharge_quality','other']),
  baselineValue: z.number(),
  targetValue: z.number(),
  currentValue: z.number().nullable().optional(),
  unit: z.string().default('m3'),
  baselineYear: z.number().int(),
  targetYear: z.number().int(),
  status: z.enum(['active','achieved','missed','paused','archived']).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

const targetUpdateSchema = targetCreateSchema.partial();

export async function waterRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Usage
  app.get('/water', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return waterService.listUsage(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/water/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return waterService.getUsage(auth.org, id);
  });

  app.post('/water', { preHandler: requirePermission('environment:create'), schema: { body: waterCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return waterService.createUsage(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/water/:id', { preHandler: requirePermission('environment:update'), schema: { body: waterUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return waterService.updateUsage(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/water/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return waterService.deleteUsage(auth.org, id, auth.sub);
  });

  // Targets
  app.get('/water/targets', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return waterService.listTargets(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/water/targets/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return waterService.getTarget(auth.org, id);
  });

  app.post('/water/targets', { preHandler: requirePermission('environment:create'), schema: { body: targetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return waterService.createTarget(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/water/targets/:id', { preHandler: requirePermission('environment:update'), schema: { body: targetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return waterService.updateTarget(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/water/targets/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return waterService.deleteTarget(auth.org, id, auth.sub);
  });

  // KPIs
  app.get('/water/kpis', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return waterService.getKpis(auth.org, req.query as Record<string, string | undefined>);
  });
}
