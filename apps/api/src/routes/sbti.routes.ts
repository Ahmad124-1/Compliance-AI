import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { sbtiService } from '../services/sbti.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const targetCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  scopeId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetType: z.enum(['near_term', 'long_term', 'net_zero']),
  targetCategory: z.enum(['absolute', 'intensity', 'renewable_energy', 'supplier_engagement', 'other']).optional(),
  baseYear: z.number().int().min(1900).max(2100),
  targetYear: z.number().int().min(1900).max(2100),
  baseYearEmissionsTco2e: z.number(),
  targetEmissionsTco2e: z.number(),
  currentEmissionsTco2e: z.number().optional(),
  reductionPct: z.number().min(0).max(100),
  progressPct: z.number().min(0).max(100).optional(),
  scopeCoverage: z.enum(['scope1', 'scope2', 'scope3', 'scope1_scope2', 'scope1_scope2_scope3']).optional(),
  pathwayType: z.enum(['linear', 's_curve', 'exponential', 'custom']).optional(),
  status: z.enum(['draft', 'submitted', 'validating', 'validated', 'active', 'at_risk', 'missed', 'achieved', 'archived']).optional(),
  validationBody: z.string().optional(),
  validationDate: z.string().optional(),
  validationDocumentUrl: z.string().url().optional(),
  milestones: z.array(z.record(z.string(), z.unknown())).optional(),
  achievedEarly: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

const targetUpdateSchema = targetCreateSchema.partial();

const milestoneCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  milestoneYear: z.number().int(),
  targetEmissionsTco2e: z.number(),
  currentEmissionsTco2e: z.number().optional(),
  status: z.enum(['pending', 'on_track', 'at_risk', 'missed', 'achieved']).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const milestoneUpdateSchema = milestoneCreateSchema.partial();

export async function sbtiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Targets ----
  app.get('/sbti/targets', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return sbtiService.listTargets(auth.org, {
      targetType: q.targetType,
      status: q.status,
      facilityId: q.facilityId,
      scopeCoverage: q.scopeCoverage,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  });

  app.get('/sbti/targets/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sbtiService.getTarget(auth.org, id);
  });

  app.post('/sbti/targets', { preHandler: requirePermission('sustainability:create'), schema: { body: targetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return sbtiService.createTarget(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/sbti/targets/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: targetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sbtiService.updateTarget(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/sbti/targets/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sbtiService.deleteTarget(auth.org, id, auth.sub);
  });

  // ---- Target Workflow ----
  app.post('/sbti/targets/:id/submit', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sbtiService.submitForValidation(auth.org, id, auth.sub);
  });

  app.post('/sbti/targets/:id/validate', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { validationBody: string; validationDate: string; documentUrl?: string };
    return sbtiService.validate(auth.org, id, body.validationBody, body.validationDate, body.documentUrl, auth.sub);
  });

  app.post('/sbti/targets/:id/activate', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return sbtiService.activate(auth.org, id, auth.sub);
  });

  // ---- Dashboard & Analytics ----
  app.get('/sbti/dashboard', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sbtiService.getDashboard(auth.org);
  });

  app.get('/sbti/stats', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sbtiService.getProgressStats(auth.org);
  });

  app.get('/sbti/forecast', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sbtiService.getForecast(auth.org);
  });

  app.get('/sbti/recommendations', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return sbtiService.getAiRecommendations(auth.org);
  });

  // ---- Milestones ----
  app.get('/sbti/targets/:targetId/milestones', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { targetId } = req.params as { targetId: string };
    await sbtiService.getTarget(auth.org, targetId); // verify access
    return sbtiService.listMilestones(targetId);
  });

  app.post('/sbti/targets/:targetId/milestones', { preHandler: requirePermission('sustainability:create'), schema: { body: milestoneCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { targetId } = req.params as { targetId: string };
    return sbtiService.createMilestone(auth.org, targetId, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/sbti/targets/:targetId/milestones/:milestoneId', { preHandler: requirePermission('sustainability:update'), schema: { body: milestoneUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { targetId, milestoneId } = req.params as { targetId: string; milestoneId: string };
    return sbtiService.updateMilestone(auth.org, targetId, milestoneId, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/sbti/targets/:targetId/milestones/:milestoneId', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { targetId, milestoneId } = req.params as { targetId: string; milestoneId: string };
    return sbtiService.deleteMilestone(auth.org, targetId, milestoneId, auth.sub);
  });
}

