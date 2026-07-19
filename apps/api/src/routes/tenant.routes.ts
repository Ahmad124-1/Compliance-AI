import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { tenantService } from '../services/tenant.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const siteSchema = z.object({
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  address: z.record(z.any()).nullable().optional(),
});
const deptSchema = z.object({
  name: z.string().min(1),
  siteId: z.string().uuid().nullable().optional(),
  code: z.string().nullable().optional(),
});
const teamSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().uuid().nullable().optional(),
  code: z.string().nullable().optional(),
});

export async function tenantRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Sites
  app.get('/sites', { preHandler: requirePermission('site:read') }, async (req) => {
    const auth = getAuth(req);
    return tenantService.listSites(auth.org);
  });
  app.post('/sites', { preHandler: requirePermission('site:create'), schema: { body: siteSchema } }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as z.infer<typeof siteSchema>;
    return tenantService.createSite(auth.org, b.name, b.code ?? null, b.address ?? null, auth.sub);
  });
  app.patch('/sites/:id', { preHandler: requirePermission('site:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return tenantService.updateSite(auth.org, id, req.body as any);
  });

  // Departments
  app.get('/departments', { preHandler: requirePermission('department:read') }, async (req) => {
    const auth = getAuth(req);
    return tenantService.listDepartments(auth.org);
  });
  app.post('/departments', { preHandler: requirePermission('department:create'), schema: { body: deptSchema } }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as z.infer<typeof deptSchema>;
    return tenantService.createDepartment(auth.org, b.name, b.siteId ?? null, b.code ?? null, auth.sub);
  });
  app.patch('/departments/:id', { preHandler: requirePermission('department:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return tenantService.updateDepartment(auth.org, id, req.body as any);
  });

  // Teams
  app.get('/teams', { preHandler: requirePermission('team:read') }, async (req) => {
    const auth = getAuth(req);
    return tenantService.listTeams(auth.org);
  });
  app.post('/teams', { preHandler: requirePermission('team:create'), schema: { body: teamSchema } }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as z.infer<typeof teamSchema>;
    return tenantService.createTeam(auth.org, b.name, b.departmentId ?? null, b.code ?? null, auth.sub);
  });
  app.patch('/teams/:id', { preHandler: requirePermission('team:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return tenantService.updateTeam(auth.org, id, req.body as any);
  });
}
