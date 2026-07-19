export const TENANT_ENDPOINTS = {
  organizations: '/api/v1/organizations',
  sites: '/api/v1/tenants/sites',
  departments: '/api/v1/tenants/departments',
  teams: '/api/v1/tenants/teams',
} as const;

export const TENANT_ROUTES = {
  organizations: '/admin/organizations',
  sites: '/admin/sites',
  departments: '/admin/departments',
  teams: '/admin/teams',
} as const;
