import { rbacApi } from './module.api.js';
import type { CreateGroupInput, CreateRoleInput } from './module.validation.js';

/**
 * Client service for RBAC operations.
 */
export const rbacService = {
  listPermissions: () => rbacApi.listPermissions(),
  listGroups: () => rbacApi.listGroups(),
  createGroup: (dto: CreateGroupInput) => rbacApi.createGroup(dto),
  addPermissionToGroup: (groupId: string, permissionId: string) =>
    rbacApi.addPermissionToGroup(groupId, permissionId),
  listRoles: () => rbacApi.listRoles(),
  createRole: (dto: CreateRoleInput) => rbacApi.createRole(dto),
  rolePermissions: (roleId: string) => rbacApi.rolePermissions(roleId),
  assignPermission: (roleId: string, permissionId: string) =>
    rbacApi.assignPermission(roleId, permissionId),
  assignGroup: (roleId: string, groupId: string) => rbacApi.assignGroup(roleId, groupId),
};
