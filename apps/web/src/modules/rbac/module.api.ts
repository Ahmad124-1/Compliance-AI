import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { RBAC_ENDPOINTS } from './module.constants.js';
import type { CreateGroupInput, CreateRoleInput } from './module.validation.js';
import type { Permission, PermissionGroup, Role } from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const rbacApi = {
  listPermissions: () => http<Permission[]>(RBAC_ENDPOINTS.permissions),
  listGroups: () => http<PermissionGroup[]>(RBAC_ENDPOINTS.permissionGroups),
  createGroup: (dto: CreateGroupInput) =>
    http<PermissionGroup>(RBAC_ENDPOINTS.permissionGroups, { method: 'POST', body: JSON.stringify(dto) }),
  addPermissionToGroup: (groupId: string, permissionId: string) =>
    http(`${RBAC_ENDPOINTS.permissionGroups}/${groupId}/permissions/${permissionId}`, { method: 'POST' }),
  listRoles: () => http<Role[]>(RBAC_ENDPOINTS.roles),
  createRole: (dto: CreateRoleInput) =>
    http<Role>(RBAC_ENDPOINTS.roles, { method: 'POST', body: JSON.stringify(dto) }),
  rolePermissions: (roleId: string) =>
    http<Permission[]>(`${RBAC_ENDPOINTS.roles}/${roleId}/permissions`),
  assignPermission: (roleId: string, permissionId: string) =>
    http(`${RBAC_ENDPOINTS.roles}/${roleId}/permissions/${permissionId}`, { method: 'POST' }),
  assignGroup: (roleId: string, groupId: string) =>
    http(`${RBAC_ENDPOINTS.roles}/${roleId}/groups/${groupId}`, { method: 'POST' }),
};
