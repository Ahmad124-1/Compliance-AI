import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { TENANT_ENDPOINTS } from './module.constants.js';
import type {
  CreateDepartmentInput,
  CreateOrganizationInput,
  CreateSiteInput,
  CreateTeamInput,
} from './module.validation.js';
import type { Department, Organization, Site, Team } from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const tenantApi = {
  listOrganizations: () => http<Organization[]>(TENANT_ENDPOINTS.organizations),
  getOrganization: (id: string) => http<Organization>(`${TENANT_ENDPOINTS.organizations}/${id}`),
  createOrganization: (dto: CreateOrganizationInput) =>
    http<Organization>(TENANT_ENDPOINTS.organizations, { method: 'POST', body: JSON.stringify(dto) }),
  updateOrganization: (id: string, dto: Partial<CreateOrganizationInput & { isActive: boolean }>) =>
    http<Organization>(`${TENANT_ENDPOINTS.organizations}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteOrganization: (id: string) =>
    http(`${TENANT_ENDPOINTS.organizations}/${id}`, { method: 'DELETE' }),

  listSites: () => http<Site[]>(TENANT_ENDPOINTS.sites),
  createSite: (dto: CreateSiteInput) =>
    http<Site>(TENANT_ENDPOINTS.sites, { method: 'POST', body: JSON.stringify(dto) }),
  updateSite: (id: string, dto: Partial<CreateSiteInput & { isActive: boolean }>) =>
    http<Site>(`${TENANT_ENDPOINTS.sites}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  listDepartments: () => http<Department[]>(TENANT_ENDPOINTS.departments),
  createDepartment: (dto: CreateDepartmentInput) =>
    http<Department>(TENANT_ENDPOINTS.departments, { method: 'POST', body: JSON.stringify(dto) }),
  updateDepartment: (id: string, dto: Partial<CreateDepartmentInput & { isActive: boolean }>) =>
    http<Department>(`${TENANT_ENDPOINTS.departments}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  listTeams: () => http<Team[]>(TENANT_ENDPOINTS.teams),
  createTeam: (dto: CreateTeamInput) =>
    http<Team>(TENANT_ENDPOINTS.teams, { method: 'POST', body: JSON.stringify(dto) }),
  updateTeam: (id: string, dto: Partial<CreateTeamInput & { isActive: boolean }>) =>
    http<Team>(`${TENANT_ENDPOINTS.teams}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
};
