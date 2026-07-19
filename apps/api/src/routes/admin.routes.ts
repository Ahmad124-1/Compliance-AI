import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { grievanceService, lookupService, qrService } from '../modules/grievances/services/grievance.service.js';
import type { GrievanceStatus, GrievancePriority, GrievanceSeverity } from '../modules/grievances/types.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const _categoryCreateSchema = z.object({
  organizationId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
});

const _portalConfigSchema = z.object({
  theme: z.record(z.any()).optional(),
  languages: z.array(z.string()).optional(),
  customText: z.record(z.any()).optional(),
});

const _qrCreateSchema = z.object({
  organizationId: z.string().uuid(),
  portalUrl: z.string().url(),
  configuration: z.record(z.any()).optional(),
});

export async function adminGrievanceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/admin/grievances', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { status?: GrievanceStatus; category?: string; source?: string };
    return grievanceService.list(auth.org, { status: q.status, category: q.category, source: q.source });
  });

  app.get('/admin/grievances/:id', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const grievance = await grievanceService.findById(id);
    if (!grievance || grievance.organizationId !== auth.org) {
      throw new Error('Not found');
    }
    return grievance;
  });

  app.patch('/admin/grievances/:id', { preHandler: requirePermission('grievance:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { status?: GrievanceStatus; priority?: GrievancePriority; severity?: GrievanceSeverity | null };
    const grievance = await grievanceService.findById(id);
    if (!grievance || grievance.organizationId !== auth.org) {
      throw new Error('Not found');
    }
    return grievanceService.update(id, body);
  });

  app.get('/admin/grievances/:id/attachments', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return grievanceService.getAttachments(id);
  });

  app.post('/admin/categories', { preHandler: requirePermission('grievance:create') }, async (req) => {
    const body = req.body as z.infer<typeof _categoryCreateSchema>;
    return lookupService.createCategory(body);
  });

  app.get('/admin/categories', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const auth = getAuth(req);
    return lookupService.categories(auth.org);
  });

  app.post('/admin/categories/create', { preHandler: requirePermission('grievance:create') }, async (req) => {
    const body = req.body as z.infer<typeof _categoryCreateSchema>;
    return lookupService.createCategory(body);
  });

  app.get('/admin/portal-config', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const auth = getAuth(req);
    const config = await lookupService.portalConfig(auth.org);
    return config ?? { organizationId: auth.org, theme: {}, languages: [], customText: {} };
  });

  app.patch('/admin/portal-config', { preHandler: requirePermission('grievance:update') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof _portalConfigSchema>;
    return lookupService.upsertPortalConfig({ organizationId: auth.org, ...body });
  });

  app.post('/admin/qr-portals', { preHandler: requirePermission('grievance:create') }, async (req) => {
    const body = req.body as z.infer<typeof _qrCreateSchema>;
    return qrService.create(body);
  });

  app.get('/admin/qr-portals', { preHandler: requirePermission('grievance:read') }, async (req) => {
    const auth = getAuth(req);
    return qrService.list(auth.org);
  });
}
