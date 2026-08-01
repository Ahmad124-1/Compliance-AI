import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { chemicalsService } from '../services/chemicals.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const chemCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  chemicalName: z.string().min(1),
  casNumber: z.string().optional(),
  formula: z.string().optional(),
  hazardClassification: z.enum(['flammable','toxic','corrosive','explosive','reactive','environmental','carcinogen','mutagen','oxidizer','irritant','other']),
  storageLocation: z.string().optional(),
  quantity: z.number(),
  unit: z.string().default('kg'),
  supplierId: z.string().uuid().nullable().optional(),
  expiryDate: z.string().optional(),
  msdsUrl: z.string().url().optional(),
  usageDescription: z.string().optional(),
  riskRating: z.enum(['low','medium','high','extreme']).nullable().optional(),
  emergencyProcedures: z.string().optional(),
  ppeRequirements: z.string().optional(),
  approvalStatus: z.enum(['pending','approved','rejected','expired']).default('pending'),
  approvedBy: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

const chemUpdateSchema = chemCreateSchema.partial();

const containerCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  chemicalId: z.string().uuid(),
  containerType: z.enum(['drum','tote','cylinder','tank','bottle','bag','other']),
  capacity: z.number(),
  capacityUnit: z.string().default('liters'),
  currentQuantity: z.number().default(0),
  quantityUnit: z.string().default('liters'),
  storageLocation: z.string().optional(),
  storageArea: z.string().optional(),
  hazardClassification: z.string().optional(),
  status: z.enum(['in_use','empty','stored','disposed','in_transit']).default('in_use'),
  fillDate: z.string().optional(),
  emptyDate: z.string().optional(),
  inspectionFrequency: z.string().default('monthly'),
  lastInspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  notes: z.string().optional(),
});

const containerUpdateSchema = containerCreateSchema.partial();

const spillCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  chemicalId: z.string().uuid().nullable().optional(),
  incidentId: z.string().uuid().nullable().optional(),
  spillDate: z.string().optional(),
  quantitySpilled: z.number(),
  quantityUnit: z.string().default('liters'),
  spillLocation: z.string().min(1),
  spillCause: z.string().optional(),
  containmentAction: z.string().optional(),
  cleanupAction: z.string().optional(),
  cleanupStatus: z.enum(['pending','in_progress','completed','verified']).default('pending'),
  cleanupDate: z.string().optional(),
  cleanedBy: z.string().uuid().nullable().optional(),
  environmentalImpact: z.string().optional(),
  reportable: z.boolean().default(false),
  reportedToAuthority: z.boolean().default(false),
  authorityName: z.string().optional(),
  authorityReference: z.string().optional(),
  costs: z.number().optional(),
  notes: z.string().optional(),
});

const spillUpdateSchema = spillCreateSchema.partial();

export async function chemicalsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Inventory
  app.get('/chemicals', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return chemicalsService.listChemicals(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/chemicals/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.getChemical(auth.org, id);
  });

  app.post('/chemicals', { preHandler: requirePermission('environment:create'), schema: { body: chemCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return chemicalsService.createChemical(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/chemicals/:id', { preHandler: requirePermission('environment:update'), schema: { body: chemUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.updateChemical(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/chemicals/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.deleteChemical(auth.org, id, auth.sub);
  });

  // Containers
  app.get('/chemicals/containers', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return chemicalsService.listContainers(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/chemicals/containers/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.getContainer(auth.org, id);
  });

  app.post('/chemicals/containers', { preHandler: requirePermission('environment:create'), schema: { body: containerCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return chemicalsService.createContainer(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/chemicals/containers/:id', { preHandler: requirePermission('environment:update'), schema: { body: containerUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.updateContainer(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/chemicals/containers/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.deleteContainer(auth.org, id, auth.sub);
  });

  // Spills
  app.get('/chemicals/spills', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return chemicalsService.listSpills(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/chemicals/spills/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.getSpill(auth.org, id);
  });

  app.post('/chemicals/spills', { preHandler: requirePermission('environment:create'), schema: { body: spillCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return chemicalsService.createSpill(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/chemicals/spills/:id', { preHandler: requirePermission('environment:update'), schema: { body: spillUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.updateSpill(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/chemicals/spills/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return chemicalsService.deleteSpill(auth.org, id, auth.sub);
  });
}
