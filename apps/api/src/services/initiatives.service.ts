import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sustainabilityInitiativeRepo } from '../repositories/sustainability-initiative.repo.js';
import { initiativeMilestoneRepo } from '../repositories/initiative-milestone.repo.js';
import { sustainabilityKpiRepo } from '../repositories/sustainability-kpi.repo.js';

export const initiativeService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const page = (filter.page as number) ?? 1;
    const limit = (filter.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const initiatives = await sustainabilityInitiativeRepo.listByOrganization(orgId, {
      search: filter.search as string,
      programId: filter.programId as string,
      status: filter.status as string,
    });
    const total = initiatives.length;
    const paginated = initiatives.slice(offset, offset + limit);
    return { initiatives: paginated, total, page, limit };
  },

  async get(orgId: string, id: string) {
    const initiative = await sustainabilityInitiativeRepo.findById(id, orgId);
    if (!initiative) throw new NotFoundError('Initiative not found');
    const milestones = await initiativeMilestoneRepo.listByInitiative(id, orgId);
    const kpis = await sustainabilityKpiRepo.listByOrganization(orgId, { initiativeId: id });
    return { ...initiative, milestones, kpis: kpis.length };
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const initiative = await sustainabilityInitiativeRepo.create({
      organizationId: orgId,
      programId: input.programId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      ownerId: input.ownerId as string | undefined,
      team: (input.team as string) ?? '',
      startDate: input.startDate as string | undefined,
      dueDate: input.dueDate as string | undefined,
      budget: input.budget as number | undefined,
      expectedImpact: input.expectedImpact as string | undefined,
      actualImpact: input.actualImpact as string | undefined,
      status: (input.status as string) ?? 'planning',
      riskLevel: (input.riskLevel as string) ?? 'low',
      linkedSdgs: (input.linkedSdgs as number[]) ?? [],
    });
    await audit({ action: 'sustainability.initiative.create', entity: 'sustainability_initiative', entityId: initiative.id });
    return initiative;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'ownerId', 'team', 'startDate', 'dueDate', 'budget', 'expectedImpact', 'actualImpact', 'status', 'riskLevel', 'linkedSdgs']) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const initiative = await sustainabilityInitiativeRepo.update(id, orgId, patch);
    if (!initiative) throw new NotFoundError('Initiative not found');
    await audit({ action: 'sustainability.initiative.update', entity: 'sustainability_initiative', entityId: id });
    return initiative;
  },

  async delete(orgId: string, id: string) {
    const existing = await sustainabilityInitiativeRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Initiative not found');
    await sustainabilityInitiativeRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.initiative.delete', entity: 'sustainability_initiative', entityId: id });
    return { success: true };
  },
};

export const milestoneService = {
  async create(orgId: string, input: Record<string, unknown>) {
    const milestone = await initiativeMilestoneRepo.create({
      organizationId: orgId,
      initiativeId: input.initiativeId as string,
      name: input.name as string,
      description: input.description as string | undefined,
      dueDate: input.dueDate as string | undefined,
      ownerId: input.ownerId as string | undefined,
      sortOrder: (input.sortOrder as number) ?? 0,
    });
    await audit({ action: 'sustainability.milestone.create', entity: 'initiative_milestone', entityId: milestone.id });
    return milestone;
  },

  async listByInitiative(orgId: string, initiativeId: string) {
    return initiativeMilestoneRepo.listByInitiative(initiativeId, orgId);
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'dueDate', 'completionDate', 'status', 'ownerId', 'sortOrder']) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const milestone = await initiativeMilestoneRepo.update(id, orgId, patch);
    if (!milestone) throw new NotFoundError('Milestone not found');
    await audit({ action: 'sustainability.milestone.update', entity: 'initiative_milestone', entityId: id });
    return milestone;
  },

  async delete(orgId: string, id: string) {
    const existing = await initiativeMilestoneRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Milestone not found');
    await initiativeMilestoneRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.milestone.delete', entity: 'initiative_milestone', entityId: id });
    return { success: true };
  },
};
