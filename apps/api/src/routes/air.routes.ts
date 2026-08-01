import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { airService } from '../services/air.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const emissionCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  emissionSourceId: z.string().uuid().nullable().optional(),
  emissionType: z.enum(['stack','boiler','generator','dust','voc','nox','sox','pm25','pm10','co','co2','methane','other']),
  quantity: z.number(),
  unit: z.string().default('kg'),
  monitoringFrequency: z.enum(['continuous','daily','weekly','monthly','quarterly','yearly','other']).nullable().optional(),
  emissionLimit: z.number().optional(),
  concentration: z.number().optional(),
  emissionDate: z.string().min(1),
  reportingPeriod: z.string().min(1),
  notes: z.string().optional(),
});

const emissionUpdateSchema = emissionCreateSchema.partial();

const limitCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  permitId: z.string().uuid().nullable().optional(),
  emissionType: z.enum(['pm25','pm10','nox','sox','voc','co','co2','methane','dust','stack','other']),
  limitValue: z.number(),
  limitUnit: z.string().default('kg/year'),
  monitoringFrequency: z.enum(['continuous','daily','weekly','monthly','quarterly','yearly']).default('monthly'),
  maxConcentration: z.number().optional(),
  concentrationUnit: z.string().default('mg/m3'),
  effectiveDate: z.string().min(1),
  expiryDate: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

const limitUpdateSchema = limitCreateSchema.partial();

export async function airRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Emissions
  app.get('/air', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return airService.listEmissions(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/air/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return airService.getEmission(auth.org, id);
  });

  app.post('/air', { preHandler: requirePermission('environment:create'), schema: { body: emissionCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return airService.createEmission(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/air/:id', { preHandler: requirePermission('environment:update'), schema: { body: emissionUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return airService.updateEmission(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/air/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return airService.deleteEmission(auth.org, id, auth.sub);
  });

  // Limits
  app.get('/air/limits', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return airService.listLimits(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/air/limits/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return airService.getLimit(auth.org, id);
  });

  app.post('/air/limits', { preHandler: requirePermission('environment:create'), schema: { body: limitCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return airService.createLimit(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/air/limits/:id', { preHandler: requirePermission('environment:update'), schema: { body: limitUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return airService.updateLimit(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/air/limits/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return airService.deleteLimit(auth.org, id, auth.sub);
  });

  // KPIs
  app.get('/air/kpis', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return airService.getKpis(auth.org, req.query as Record<string, string | undefined>);
  });
}
