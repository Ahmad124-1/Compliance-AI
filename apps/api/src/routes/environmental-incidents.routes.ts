import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentalIncidentsService } from '../services/environmental-incidents.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const incidentCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  incidentType: z.enum(['chemical_spill','water_leak','oil_spill','air_pollution','illegal_disposal','hazardous_release','permit_violation','environmental_complaint','noise_pollution','soil_contamination','other']),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['low','medium','high','critical']).default('medium'),
  status: z.enum(['open','investigating','contained','resolved','closed','escalated']).default('open'),
  incidentDate: z.string().optional(),
  location: z.string().optional(),
  rootCause: z.string().optional(),
  capaId: z.string().uuid().nullable().optional(),
  investigationStatus: z.enum(['pending','in_progress','completed','not_required']).nullable().optional(),
  investigationNotes: z.string().optional(),
  evidenceUrls: z.array(z.string()).default([]),
  timeline: z.array(z.record(z.string(), z.unknown())).default([]),
  responsiblePersonId: z.string().uuid().nullable().optional(),
  resolvedBy: z.string().uuid().nullable().optional(),
  resolutionDate: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

const incidentUpdateSchema = incidentCreateSchema.partial();

export async function environmentalIncidentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/environmental-incidents', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalIncidentsService.list(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/environmental-incidents/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalIncidentsService.get(auth.org, id);
  });

  app.post('/environmental-incidents', { preHandler: requirePermission('environment:create'), schema: { body: incidentCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentalIncidentsService.create(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/environmental-incidents/:id', { preHandler: requirePermission('environment:update'), schema: { body: incidentUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalIncidentsService.update(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/environmental-incidents/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalIncidentsService.delete(auth.org, id, auth.sub);
  });
}
