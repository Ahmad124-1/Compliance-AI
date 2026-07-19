import { ConflictError, NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { permissionRepo, permissionGroupRepo, roleRepo } from '../repositories/rbac.repo.js';
import { rbacService } from './rbac.service.js';

export const rbacManagement = {
  // Permissions
  async listPermissions() {
    return permissionRepo.list();
  },
  async ensureSeeded() {
    await rbacService.ensureSeeded();
  },

  // Permission groups
  async listGroups() {
    const groups = await permissionGroupRepo.list();
    return Promise.all(
      groups.map(async (g) => ({ ...g, permissions: await permissionGroupRepo.permissionsForGroup(g.id) })),
    );
  },
  async createGroup(name: string, description?: string | null) {
    return permissionGroupRepo.create(name, description);
  },
  async addPermissionToGroup(groupId: string, permissionId: string) {
    await permissionGroupRepo.addPermission(groupId, permissionId);
  },

  // Roles
  async listRoles(orgId: string) {
    return roleRepo.listByOrganization(orgId);
  },
  async createRole(orgId: string, name: string, key: string, description?: string | null, actorId?: string) {
    const existing = await roleRepo.findByKey(orgId, key);
    if (existing) throw new ConflictError('Role key already exists in organization');
    const role = await roleRepo.create(orgId, name, key, { description });
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'role.create', entity: 'role', entityId: role.id });
    return role;
  },
  async assignPermission(orgId: string, roleId: string, permissionId: string) {
    const role = await roleRepo.findById(roleId);
    if (!role || role.organizationId !== orgId) throw new NotFoundError('Role not found');
    await roleRepo.assignPermission(roleId, permissionId);
  },
  async assignGroup(orgId: string, roleId: string, groupId: string) {
    const role = await roleRepo.findById(roleId);
    if (!role || role.organizationId !== orgId) throw new NotFoundError('Role not found');
    await roleRepo.assignGroup(roleId, groupId);
  },
  async permissionsForRole(roleId: string) {
    return roleRepo.permissionsForRole(roleId);
  },
};
