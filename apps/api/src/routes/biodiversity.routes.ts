import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { biodiversityService } from '../services/biodiversity.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const biodivCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  recordType: z.enum(['protected_area','land_usage','tree_plantation','tree_loss','habitat_restoration','species_monitoring','community_project','green_area','other']),
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  areaSize: z.number().optional(),
  areaUnit: z.string().default('hectares'),
  treesPlanted: z.number().int().default(0),
  treesLost: z.number().int().default(0),
  speciesCount: z.number().int().optional(),
  speciesList: z.array(z.string()).default([]),
  protectedSpecies: z.array(z.string()).default([]),
  restorationArea: z.number().optional(),
  restorationStatus: z.enum(['planning','in_progress','completed','monitoring','cancelled']).optional(),
  communityParticipants: z.number().int().optional(),
  communityPartner: z.string().optional(),
  fundingAmount: z.number().optional(),
  fundingSource: z.string().optional(),
  status: z.enum(['active','completed','cancelled','planned']).default('active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  evidenceUrls: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const biodivUpdateSchema = biodivCreateSchema.partial();

export async function biodiversityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/biodiversity', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return biodiversityService.list(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/biodiversity/kpis', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return biodiversityService.getKpis(auth.org);
  });

  app.get('/biodiversity/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return biodiversityService.get(auth.org, id);
  });

  app.post('/biodiversity', { preHandler: requirePermission('environment:create'), schema: { body: biodivCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return biodiversityService.create(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/biodiversity/:id', { preHandler: requirePermission('environment:update'), schema: { body: biodivUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return biodiversityService.update(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/biodiversity/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return biodiversityService.delete(auth.org, id, auth.sub);
  });
}
