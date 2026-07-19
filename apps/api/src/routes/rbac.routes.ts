import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { rbacManagement } from '../services/rbac-management.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const roleCreateSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
});

export async function rbacRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Permissions (read-only catalogue)
  app.get('/permissions', { preHandler: requirePermission('permission:read') }, async () => {
    return rbacManagement.listPermissions();
  });

  // Permission groups
  app.get('/permission-groups', { preHandler: requirePermission('permission:read') }, async () => {
    return rbacManagement.listGroups();
  });
  app.post('/permission-groups', { preHandler: requirePermission('permission:create') }, async (req) => {
    const b = req.body as { name: string; description?: string };
    return rbacManagement.createGroup(b.name, b.description ?? null);
  });
  app.post('/permission-groups/:groupId/permissions/:permissionId', { preHandler: requirePermission('permission:assign') }, async (req) => {
    const { groupId, permissionId } = req.params as { groupId: string; permissionId: string };
    await rbacManagement.addPermissionToGroup(groupId, permissionId);
    return { success: true };
  });

  // Roles
  app.get('/roles', { preHandler: requirePermission('role:read') }, async (req) => {
    const auth = getAuth(req);
    return rbacManagement.listRoles(auth.org);
  });
  app.post('/roles', { preHandler: requirePermission('role:create'), schema: { body: roleCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const b = req.body as z.infer<typeof roleCreateSchema>;
    return rbacManagement.createRole(auth.org, b.name, b.key, b.description ?? null, auth.sub);
  });
  app.get('/roles/:roleId/permissions', { preHandler: requirePermission('role:read') }, async (req) => {
    const { roleId } = req.params as { roleId: string };
    return rbacManagement.permissionsForRole(roleId);
  });
  app.post('/roles/:roleId/permissions/:permissionId', { preHandler: requirePermission('role:assign') }, async (req) => {
    const auth = getAuth(req);
    const { roleId, permissionId } = req.params as { roleId: string; permissionId: string };
    await rbacManagement.assignPermission(auth.org, roleId, permissionId);
    return { success: true };
  });
  app.post('/roles/:roleId/groups/:groupId', { preHandler: requirePermission('role:assign') }, async (req) => {
    const auth = getAuth(req);
    const { roleId, groupId } = req.params as { roleId: string; groupId: string };
    await rbacManagement.assignGroup(auth.org, roleId, groupId);
    return { success: true };
  });
}
