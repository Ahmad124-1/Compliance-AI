import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { carbonService } from '../services/carbon.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const scopeCreateSchema = z.object({
  name: z.string().min(1),
  scopeNumber: z.number().int().min(1).max(3),
  description: z.string().optional(),
});

const scopeUpdateSchema = scopeCreateSchema.partial();

const emissionSourceCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  sourceCategory: z.enum([
    'fuel_consumption', 'electricity', 'steam', 'purchased_energy',
    'water', 'waste', 'business_travel', 'flights', 'hotels',
    'employee_commuting', 'freight', 'shipping', 'raw_materials',
    'packaging', 'suppliers', 'purchased_goods', 'refrigerants',
    'industrial_processes', 'other',
  ]),
  sourceType: z.enum([
    'diesel', 'petrol', 'natural_gas', 'coal', 'generators',
    'company_vehicles', 'electricity', 'steam', 'purchased_cooling',
    'water', 'waste', 'flights', 'hotels', 'commute', 'freight',
    'shipping', 'raw_materials', 'packaging', 'suppliers',
    'refrigerants', 'industrial', 'custom', 'lpg', 'purchased_heat',
    'purchased_steam', 'purchased_energy', 'biomass', 'solar_pv', 'wind',
  ]),
  scopeId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function ghgRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Scopes ----
  app.get('/ghg/scopes', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    return carbonService.listScopes(auth.org);
  });

  app.get('/ghg/scopes/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getScope(auth.org, id);
  });

  app.post('/ghg/scopes', { preHandler: requirePermission('sustainability:create'), schema: { body: scopeCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createScope(auth.org, req.body as Record<string, unknown>);
  });

  app.patch('/ghg/scopes/:id', { preHandler: requirePermission('sustainability:update'), schema: { body: scopeUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateScope(auth.org, id, req.body as Record<string, unknown>);
  });

  // ---- Emission Sources ----
  app.get('/ghg/sources', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listEmissionSources(auth.org, {
      facilityId: q.facilityId,
      sourceCategory: q.sourceCategory,
      sourceType: q.sourceType,
    });
  });

  app.get('/ghg/sources/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getEmissionSource(auth.org, id);
  });

  app.post('/ghg/sources', { preHandler: requirePermission('sustainability:create'), schema: { body: emissionSourceCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createEmissionSource(auth.org, req.body as Record<string, unknown>);
  });

  app.patch('/ghg/sources/:id', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateEmissionSource(auth.org, id, req.body as Partial<Record<string, unknown>>);
  });

  app.delete('/ghg/sources/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteEmissionSource(auth.org, id);
  });

  // ---- Emission Factors ----
  app.get('/ghg/factors', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listEmissionFactors(auth.org, {
      factorType: q.factorType,
      category: q.category,
      activeOnly: q.activeOnly === 'true',
    });
  });

  app.get('/ghg/factors/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getEmissionFactor(auth.org, id);
  });

  app.post('/ghg/factors', { preHandler: requirePermission('sustainability:create') }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createEmissionFactor(auth.org, req.body as Record<string, unknown>);
  });

  app.patch('/ghg/factors/:id', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateEmissionFactor(auth.org, id, req.body as Record<string, unknown>);
  });

  app.delete('/ghg/factors/:id', { preHandler: requirePermission('sustainability:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.deleteEmissionFactor(auth.org, id);
  });

  // ---- Emission Records ----
  app.get('/ghg/emissions', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return carbonService.listEmissionRecords(auth.org, {
      facilityId: q.facilityId,
      scopeId: q.scopeId,
      reportingPeriod: q.reportingPeriod,
    });
  });

  app.get('/ghg/emissions/:id', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.getEmissionRecord(auth.org, id);
  });

  app.post('/ghg/emissions', { preHandler: requirePermission('sustainability:create') }, async (req) => {
    const auth = getAuth(req);
    return carbonService.createEmissionRecord(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/ghg/emissions/:id', { preHandler: requirePermission('sustainability:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return carbonService.updateEmissionRecord(auth.org, id, req.body as Partial<Record<string, unknown>>, auth.sub);
  });
}

