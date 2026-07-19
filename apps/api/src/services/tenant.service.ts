import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { siteRepo } from '../repositories/site.repo.js';
import { departmentRepo } from '../repositories/department.repo.js';
import { teamRepo } from '../repositories/team.repo.js';

/**
 * Tenant hierarchy services: sites (factories), departments, teams.
 * All operations are scoped to the caller's organization (multi-tenant isolation).
 */
export const tenantService = {
  // Sites
  async listSites(orgId: string) {
    return siteRepo.listByOrganization(orgId);
  },
  async createSite(orgId: string, name: string, code?: string | null, address?: Record<string, unknown> | null, actorId?: string) {
    const site = await siteRepo.create(orgId, name, code, address);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'site.create', entity: 'site', entityId: site.id });
    return site;
  },
  async updateSite(orgId: string, id: string, patch: Parameters<typeof siteRepo.update>[1]) {
    const existing = await siteRepo.findById(id);
    if (!existing || existing.organizationId !== orgId) throw new NotFoundError('Site not found');
    return siteRepo.update(id, patch);
  },

  // Departments
  async listDepartments(orgId: string) {
    return departmentRepo.listByOrganization(orgId);
  },
  async createDepartment(orgId: string, name: string, siteId?: string | null, code?: string | null, actorId?: string) {
    const dept = await departmentRepo.create(orgId, name, siteId, code);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'department.create', entity: 'department', entityId: dept.id });
    return dept;
  },
  async updateDepartment(orgId: string, id: string, patch: Parameters<typeof departmentRepo.update>[1]) {
    const existing = await departmentRepo.findById(id);
    if (!existing || existing.organizationId !== orgId) throw new NotFoundError('Department not found');
    return departmentRepo.update(id, patch);
  },

  // Teams
  async listTeams(orgId: string) {
    return teamRepo.listByOrganization(orgId);
  },
  async createTeam(orgId: string, name: string, departmentId?: string | null, code?: string | null, actorId?: string) {
    const team = await teamRepo.create(orgId, name, departmentId, code);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'team.create', entity: 'team', entityId: team.id });
    return team;
  },
  async updateTeam(orgId: string, id: string, patch: Parameters<typeof teamRepo.update>[1]) {
    const existing = await teamRepo.findById(id);
    if (!existing || existing.organizationId !== orgId) throw new NotFoundError('Team not found');
    return teamRepo.update(id, patch);
  },
};
