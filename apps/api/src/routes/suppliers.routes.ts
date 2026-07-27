import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { supplierService } from '../services/suppliers.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const supplierCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  businessUnit: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'blacklisted']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const supplierUpdateSchema = supplierCreateSchema.partial();

export async function supplierRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { category?: string; country?: string; riskLevel?: string; status?: string; search?: string; limit?: string; offset?: string };
    const suppliers = await supplierService.listSuppliers(auth.org, {
      category: q.category,
      country: q.country,
      riskLevel: q.riskLevel,
      status: q.status,
      search: q.search,
    });
    return { suppliers, total: suppliers.length };
  });

  app.get('/suppliers/stats', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return supplierService.getSupplierStats(auth.org);
  });

  app.get('/suppliers/ranking', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return supplierService.getSupplierRanking(auth.org);
  });

  app.get('/suppliers/:id', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const supplier = await supplierService.getSupplier(id, auth.org);
    const facilities = await supplierService.getSupplierFacilities(id, auth.org);
    return { ...supplier, facilities };
  });

  app.post('/suppliers', { preHandler: requirePermission('suppliers:create'), schema: { body: supplierCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof supplierCreateSchema>;
    const supplier = await supplierService.createSupplier(auth.org, body as any, auth.sub);
    return supplier;
  });

  app.put('/suppliers/:id', { preHandler: requirePermission('suppliers:write'), schema: { body: supplierUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof supplierUpdateSchema>;
    return supplierService.updateSupplier(id, auth.org, body as any, auth.sub);
  });

  app.delete('/suppliers/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierService.deleteSupplier(id, auth.org, auth.sub);
    return { success: true };
  });

  app.post('/suppliers/:id/facilities', { preHandler: requirePermission('suppliers:write') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { name: string; facilityType: string; address?: Record<string, unknown>; city?: string; region?: string; country?: string; latitude?: number; longitude?: number };
    return supplierService.createFacility(id, auth.org, body as any, auth.sub);
  });
}