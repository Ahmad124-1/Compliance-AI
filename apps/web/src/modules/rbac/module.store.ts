import { rbacService } from './module.service.js';
import type { Permission, PermissionGroup, Role } from './module.types.js';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * React hooks backed by TanStack Query for RBAC data.
 */
export function usePermissions() {
  return useQuery({ queryKey: ['rbac', 'permissions'], queryFn: rbacService.listPermissions });
}

export function usePermissionGroups() {
  return useQuery({ queryKey: ['rbac', 'groups'], queryFn: rbacService.listGroups });
}

export function useRoles() {
  return useQuery({ queryKey: ['rbac', 'roles'], queryFn: rbacService.listRoles });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rbacService.createRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useRolePermissions(roleId?: string) {
  return useQuery({
    queryKey: ['rbac', 'role-perms', roleId],
    queryFn: () => rbacService.rolePermissions(roleId as string),
    enabled: !!roleId,
  });
}

export function useAssignPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { roleId: string; permissionId: string }) =>
      rbacService.assignPermission(vars.roleId, vars.permissionId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['rbac', 'role-perms', v.roleId] }),
  });
}

export type { Permission, PermissionGroup, Role };
