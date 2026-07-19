export const RBAC_ENDPOINTS = {
  permissions: '/api/v1/rbac/permissions',
  permissionGroups: '/api/v1/rbac/permission-groups',
  roles: '/api/v1/rbac/roles',
} as const;

export const RBAC_ROUTES = {
  roles: '/admin/roles',
  permissions: '/admin/permissions',
} as const;
