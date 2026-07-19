import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { standardsService } from '../modules/standards/services/standard.service.js';
import { frameworkService } from '../modules/standards/services/framework.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const standardCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  publisher: z.string().optional(),
  category: z.enum(['quality', 'environment', 'social', 'energy', 'esg', 'custom']).optional(),
  isActive: z.boolean().optional(),
});

const frameworkEnableSchema = z.object({ frameworkId: z.string().uuid() });

const assignSchema = z.object({
  scope: z.enum(['organization', 'site', 'department']),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
});

const applicabilitySchema = z.object({ applicable: z.boolean(), notes: z.string().nullable().optional() });

const controlStatusSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'implemented', 'not_applicable']),
  ownerId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const importSchema = z.object({
  standard: z.object({
    name: z.string(),
    code: z.string(),
    description: z.string().optional(),
    publisher: z.string().optional(),
    category: z.string().optional(),
  }),
  framework: z.object({
    version: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published', 'deprecated']).optional(),
  }),
  categories: z.array(z.object({ code: z.string().optional(), name: z.string(), position: z.number().optional() })).optional(),
  clauses: z.array(z.any()).optional(),
  requirements: z.array(z.any()).optional(),
});

export async function standardsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Standards catalogue ----
  app.get('/standards', { preHandler: requirePermission('standard:read') }, async (req) => {
    const q = req.query as { search?: string; category?: string; activeOnly?: string };
    return standardsService.list({
      search: q.search,
      category: q.category as any,
      activeOnly: q.activeOnly === 'true',
    });
  });

  app.get('/standards/dashboard', { preHandler: requirePermission('standard:read') }, async (req) => {
    const auth = getAuth(req);
    return standardsService.dashboard(auth.org);
  });

  app.post('/standards', { preHandler: requirePermission('standard:create'), schema: { body: standardCreateSchema } }, async (req) => {
    return standardsService.create(req.body as any);
  });

  app.get('/standards/:id', { preHandler: requirePermission('standard:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return standardsService.get(id);
  });

  app.get('/standards/:id/frameworks', { preHandler: requirePermission('standard:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return standardsService.frameworksFor(id);
  });

  app.patch('/standards/:id', { preHandler: requirePermission('standard:update') }, async (req) => {
    const { id } = req.params as { id: string };
    return standardsService.update(id, req.body as any);
  });

  // ---- Search (global) ----
  app.get('/search', { preHandler: requirePermission('standard:read') }, async (req) => {
    const auth = getAuth(req);
    const q = (req.query as { q?: string }).q ?? '';
    return frameworkService.search(auth.org, q);
  });

  // ---- Frameworks ----
  app.get('/frameworks', { preHandler: requirePermission('framework:read') }, async () => {
    return frameworkService.listFrameworks();
  });

  app.get('/frameworks/:id', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.getFramework(id);
  });

  app.get('/frameworks/:id/clause-tree', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.clauseTree(id);
  });

  app.get('/frameworks/:id/categories', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.categories(id);
  });

  app.get('/frameworks/:id/requirements', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    const q = req.query as { search?: string; categoryId?: string; clauseId?: string; mandatory?: string };
    return frameworkService.requirements(id, {
      search: q.search,
      categoryId: q.categoryId ?? null,
      clauseId: q.clauseId ?? null,
      mandatory: q.mandatory === 'true' ? true : q.mandatory === 'false' ? false : undefined,
    });
  });

  app.get('/frameworks/:id/requirements/:reqId/controls', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { reqId } = req.params as { reqId: string };
    return frameworkService.controlsForRequirement(reqId);
  });

  // ---- Adoption (organization-scoped) ----
  app.get('/organization-frameworks', { preHandler: requirePermission('framework:read') }, async (req) => {
    const auth = getAuth(req);
    return frameworkService.listAdopted(auth.org);
  });

  app.post('/organization-frameworks/enable', { preHandler: requirePermission('framework:assign'), schema: { body: frameworkEnableSchema } }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as z.infer<typeof frameworkEnableSchema>;
    return frameworkService.enable(auth.org, b.frameworkId, auth.sub);
  });

  app.post('/organization-frameworks/:id/disable', { preHandler: requirePermission('framework:assign') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const of = await frameworkService.listAdopted(auth.org);
    const target = of.find((o) => o.id === id);
    if (!target) throw new Error('Not adopted');
    return frameworkService.disable(auth.org, target.frameworkId, auth.sub);
  });

  app.patch('/organization-frameworks/:id/settings', { preHandler: requirePermission('framework:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const of = await frameworkService.listAdopted(auth.org);
    const target = of.find((o) => o.id === id);
    if (!target) throw new Error('Not adopted');
    return frameworkService.settings(auth.org, target.frameworkId, req.body as Record<string, unknown>);
  });

  // ---- Assignments ----
  app.get('/organization-frameworks/:id/assignments', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.listAssignments(id);
  });

  app.post('/organization-frameworks/:id/assignments', { preHandler: requirePermission('framework:assign'), schema: { body: assignSchema } }, async (req) => {
    const { id } = req.params as { id: string };
    const b = req.body as z.infer<typeof assignSchema>;
    return frameworkService.assignScope(id, b.scope, b.siteId ?? null, b.departmentId ?? null);
  });

  app.delete('/organization-frameworks/:id/assignments/:assignId', { preHandler: requirePermission('framework:assign') }, async (req) => {
    const { assignId } = req.params as { assignId: string };
    await frameworkService.removeAssignment(assignId);
    return { success: true };
  });

  // ---- Applicability ----
  app.post('/organization-frameworks/:id/requirements/:reqId/applicability', { preHandler: requirePermission('framework:update'), schema: { body: applicabilitySchema } }, async (req) => {
    const { id, reqId } = req.params as { id: string; reqId: string };
    const b = req.body as z.infer<typeof applicabilitySchema>;
    await frameworkService.setApplicability(id, reqId, b.applicable, b.notes ?? null);
    return { success: true };
  });

  // ---- Control status ----
  app.get('/organization-frameworks/:id/control-status', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.controlStatuses(id);
  });

  app.post('/organization-frameworks/:id/controls/:controlId/status', { preHandler: requirePermission('framework:update'), schema: { body: controlStatusSchema } }, async (req) => {
    const { id, controlId } = req.params as { id: string; controlId: string };
    const b = req.body as z.infer<typeof controlStatusSchema>;
    await frameworkService.setControlStatus(id, controlId, b.status, b.ownerId ?? null, b.notes ?? null);
    return { success: true };
  });

  // ---- Progress / compliance ----
  app.get('/organization-frameworks/:id/progress', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.progress(id);
  });

  app.get('/organization-frameworks/:id/compliance', { preHandler: requirePermission('framework:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return frameworkService.complianceStatuses(id);
  });

  // ---- Import ----
  app.post('/frameworks/import', { preHandler: requirePermission('framework:create'), schema: { body: importSchema } }, async (req) => {
    const auth = getAuth(req);
    return frameworkService.importFramework(req.body as any, auth.sub);
  });
}
