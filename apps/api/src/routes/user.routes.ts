import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { userService } from '../services/user.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
});

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().optional(),
  preferences: z.record(z.any()).optional(),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', { preHandler: requirePermission('user:read') }, async (req) => {
    const auth = getAuth(req);
    return userService.list(auth.org);
  });

  app.get('/:id', { preHandler: requirePermission('user:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return userService.getById(auth.org, id);
  });

  app.post('/invite', { preHandler: requirePermission('user:invite'), schema: { body: inviteSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof inviteSchema>;
    return userService.invite({ ...body, organizationId: auth.org, invitedBy: auth.sub });
  });

  app.post('/:id/activate', { preHandler: requirePermission('user:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return userService.activate(auth.org, id, auth.sub);
  });

  app.post('/:id/disable', { preHandler: requirePermission('user:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return userService.disable(auth.org, id, auth.sub);
  });

  app.patch('/:id/profile', { preHandler: requirePermission('user:update', 'profile:update'), schema: { body: profileSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof profileSchema>;
    return userService.updateProfile(auth.org, id, body);
  });

  app.post('/:id/roles/:roleId', { preHandler: requirePermission('user:assign') }, async (req) => {
    const auth = getAuth(req);
    const { id, roleId } = req.params as { id: string; roleId: string };
    await userService.assignRole(auth.org, id, roleId, auth.sub);
    return { success: true };
  });

  app.delete('/:id/roles/:roleId', { preHandler: requirePermission('user:assign') }, async (req) => {
    const auth = getAuth(req);
    const { id, roleId } = req.params as { id: string; roleId: string };
    await userService.unassignRole(auth.org, id, roleId);
    return { success: true };
  });
}
