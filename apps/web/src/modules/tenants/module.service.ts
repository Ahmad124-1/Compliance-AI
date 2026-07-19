import { tenantApi } from './module.api.js';
import type {
  CreateDepartmentInput,
  CreateOrganizationInput,
  CreateSiteInput,
  CreateTeamInput,
} from './module.validation.js';

export const tenantService = {
  listOrganizations: () => tenantApi.listOrganizations(),
  getOrganization: (id: string) => tenantApi.getOrganization(id),
  createOrganization: (dto: CreateOrganizationInput) => tenantApi.createOrganization(dto),
  updateOrganization: (id: string, dto: Partial<CreateOrganizationInput & { isActive: boolean }>) =>
    tenantApi.updateOrganization(id, dto),
  deleteOrganization: (id: string) => tenantApi.deleteOrganization(id),

  listSites: () => tenantApi.listSites(),
  createSite: (dto: CreateSiteInput) => tenantApi.createSite(dto),
  updateSite: (id: string, dto: Partial<CreateSiteInput & { isActive: boolean }>) =>
    tenantApi.updateSite(id, dto),

  listDepartments: () => tenantApi.listDepartments(),
  createDepartment: (dto: CreateDepartmentInput) => tenantApi.createDepartment(dto),
  updateDepartment: (id: string, dto: Partial<CreateDepartmentInput & { isActive: boolean }>) =>
    tenantApi.updateDepartment(id, dto),

  listTeams: () => tenantApi.listTeams(),
  createTeam: (dto: CreateTeamInput) => tenantApi.createTeam(dto),
  updateTeam: (id: string, dto: Partial<CreateTeamInput & { isActive: boolean }>) =>
    tenantApi.updateTeam(id, dto),
};
