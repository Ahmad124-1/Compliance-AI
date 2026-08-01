import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { carbonService } from '../services/carbon.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const projectCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  projectType: z.enum(['solar_installation', 'led_replacement', 'ev_fleet', 'water_conservation', 'waste_reduction', 'recycling', 'process_optimization', 'energy_efficiency', 'renewable_energy', 'other']),
  status: z.enum(['planning', 'approved', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  budget: z.number().positive().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expectedReductionTco2e: z.number().optional(),
  actualReductionTco2e: z.number().optional(),
  roi: z.number().optional(),
  evidence: z.string().optional(),
});

const projectUpdateSchema = projectCreateSchema.partial();

export async function carbonProjectsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/carbon-projects', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listCarbonProjects(auth.org, {
      projectType: q.projectType,
      status: q.status,
      facilityId: q.facilityId,
    });
  });

  app.get('/carbon-projects/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getCarbonProject(auth.org, id);
  });

  app.post('/carbon-projects', { preHandler: requirePermission('sustainability:create'), schema: { body: projectCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createCarbonProject(auth.org, req.body as Record<string, unknown>);
  });

  app.patch('/carbon-projects/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: projectUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateCarbonProject(auth.org, id, req.body as Partial<Record<string, unknown>>);
  });

  app.delete('/carbon-projects/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteCarbonProject(auth.org, id);
  });
}

