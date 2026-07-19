import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { organizationService } from '../services/organization.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  kind: z.enum(['consultancy', 'client']).optional(),
  logoUrl: z.string().url().optional(),
  branding: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  logoUrl: z.string().url().nullable().optional(),
  branding: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export async function organizationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', { preHandler: requirePermission('org:read') }, async () => {
    return organizationService.list();
  });

  app.get('/:id', { preHandler: requirePermission('org:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return organizationService.get(id);
  });

  app.post('/', { preHandler: requirePermission('org:create'), schema: { body: createSchema } }, async (req) => {
    const auth = getAuth(req);
    return organizationService.create(req.body as any, auth.sub);
  });

  app.patch('/:id', { preHandler: requirePermission('org:update'), schema: { body: updateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return organizationService.update(id, req.body as any, auth.sub);
  });

  app.delete('/:id', { preHandler: requirePermission('org:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await organizationService.remove(id, auth.sub);
    return { success: true };
  });
}
