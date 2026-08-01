import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { wasteService } from '../services/waste.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const wasteCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  wasteType: z.enum(['general','hazardous','electronic','plastic','paper','organic','metal','chemical','medical','construction','other']),
  quantity: z.number(),
  unit: z.string().default('kg'),
  weight: z.number().optional(),
  disposalMethod: z.string().min(1),
  recyclerId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  manifestNumber: z.string().optional(),
  certificateUrl: z.string().url().optional(),
  hazardousDetails: z.string().optional(),
  wasteDate: z.string().min(1),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

const wasteUpdateSchema = wasteCreateSchema.partial();

const vendorCreateSchema = z.object({
  name: z.string().min(1),
  vendorType: z.enum(['recycler','disposal','treatment','collection','transport','other']),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  wasteTypesAccepted: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  pricingNotes: z.string().optional(),
  isApproved: z.boolean().default(false),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

const vendorUpdateSchema = vendorCreateSchema.partial();

const targetCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  wasteType: z.string(),
  targetType: z.enum(['reduction','recycling','diversion','intensity','cost_reduction','other']),
  baselineValue: z.number(),
  targetValue: z.number(),
  currentValue: z.number().nullable().optional(),
  unit: z.string().default('kg'),
  baselineYear: z.number().int(),
  targetYear: z.number().int(),
  status: z.enum(['active','achieved','missed','paused','archived']).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

const targetUpdateSchema = targetCreateSchema.partial();

export async function wasteRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Records
  app.get('/waste', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return wasteService.listRecords(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/waste/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.getRecord(auth.org, id);
  });

  app.post('/waste', { preHandler: requirePermission('environment:create'), schema: { body: wasteCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return wasteService.createRecord(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/waste/:id', { preHandler: requirePermission('environment:update'), schema: { body: wasteUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.updateRecord(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/waste/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.deleteRecord(auth.org, id, auth.sub);
  });

  // Vendors
  app.get('/waste/vendors', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return wasteService.listVendors(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/waste/vendors/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.getVendor(auth.org, id);
  });

  app.post('/waste/vendors', { preHandler: requirePermission('environment:create'), schema: { body: vendorCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return wasteService.createVendor(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/waste/vendors/:id', { preHandler: requirePermission('environment:update'), schema: { body: vendorUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.updateVendor(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/waste/vendors/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.deleteVendor(auth.org, id, auth.sub);
  });

  // Targets
  app.get('/waste/targets', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return wasteService.listTargets(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/waste/targets/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.getTarget(auth.org, id);
  });

  app.post('/waste/targets', { preHandler: requirePermission('environment:create'), schema: { body: targetCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return wasteService.createTarget(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/waste/targets/:id', { preHandler: requirePermission('environment:update'), schema: { body: targetUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.updateTarget(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/waste/targets/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return wasteService.deleteTarget(auth.org, id, auth.sub);
  });

  // KPIs
  app.get('/waste/kpis', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return wasteService.getKpis(auth.org, req.query as Record<string, string | undefined>);
  });
}
