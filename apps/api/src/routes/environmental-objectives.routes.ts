import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentalObjectivesService } from '../services/environmental-objectives.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const objectiveCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  parentObjectiveId: z.string().uuid().nullable().optional(),
  linkedGoalId: z.string().uuid().nullable().optional(),
  linkedProgramId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  objectiveType: z.enum(['waste_reduction','water_reduction','energy_efficiency','emission_reduction','pollution_prevention','recycling','biodiversity','compliance','training','chemical_safety','incident_reduction','other']),
  priority: z.enum(['low','medium','high','critical']).default('medium'),
  baselineValue: z.number().optional(),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  startDate: z.string().min(1),
  targetDate: z.string().min(1),
  status: z.enum(['draft','in_progress','achieved','missed','cancelled','on_hold']).default('draft'),
  ownerId: z.string().uuid().nullable().optional(),
  evidenceUrls: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const objectiveUpdateSchema = objectiveCreateSchema.partial();

const milestoneCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetDate: z.string().min(1),
  completionDate: z.string().optional(),
  status: z.enum(['pending','in_progress','completed','missed','cancelled']).default('pending'),
  ownerId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().default(0),
  notes: z.string().optional(),
});

const milestoneUpdateSchema = milestoneCreateSchema.partial();

export async function environmentalObjectivesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Objectives
  app.get('/environmental-objectives', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalObjectivesService.list(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/environmental-objectives/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.get(auth.org, id);
  });

  app.post('/environmental-objectives', { preHandler: requirePermission('environment:create'), schema: { body: objectiveCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentalObjectivesService.create(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/environmental-objectives/:id', { preHandler: requirePermission('environment:update'), schema: { body: objectiveUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.update(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/environmental-objectives/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.delete(auth.org, id, auth.sub);
  });

  // Milestones
  app.get('/environmental-objectives/:id/milestones', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.listMilestones(id);
  });

  app.post('/environmental-objectives/:id/milestones', { preHandler: requirePermission('environment:create'), schema: { body: milestoneCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.createMilestone(id, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/environmental-objectives/milestones/:id', { preHandler: requirePermission('environment:update'), schema: { body: milestoneUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.updateMilestone(id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/environmental-objectives/milestones/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalObjectivesService.deleteMilestone(id, auth.sub);
  });
}
