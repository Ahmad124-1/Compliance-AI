import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgGoalRepo } from '../repositories/esg-goal.repo.js';
import { sustainabilityKpiRepo } from '../repositories/sustainability-kpi.repo.js';

export const esgGoalService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const page = (filter.page as number) ?? 1;
    const limit = (filter.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const goals = await esgGoalRepo.listByOrganization(orgId, {
      search: filter.search as string,
      esgPillar: filter.esgPillar as string,
      status: filter.status as string,
      programId: filter.programId as string,
    });
    const total = goals.length;
    const paginated = goals.slice(offset, offset + limit);
    const progress = await esgGoalRepo.getProgress(orgId);
    return { goals: paginated, total, page, limit, progress };
  },

  async get(orgId: string, id: string) {
    const goal = await esgGoalRepo.findById(id, orgId);
    if (!goal) throw new NotFoundError('ESG goal not found');
    const kpis = await sustainabilityKpiRepo.listByOrganization(orgId, { goalId: id });
    return { ...goal, kpis: kpis.length };
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const goal = await esgGoalRepo.create({
      organizationId: orgId,
      programId: input.programId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      esgPillar: input.esgPillar as string,
      baseline: input.baseline as number | undefined,
      targetValue: input.targetValue as number,
      unit: (input.unit as string) ?? '%',
      currentValue: input.currentValue as number | undefined,
      deadline: input.deadline as string | undefined,
      ownerId: input.ownerId as string | undefined,
      confidence: (input.confidence as string) ?? 'medium',
      riskLevel: (input.riskLevel as string) ?? 'low',
      linkedSdgs: (input.linkedSdgs as number[]) ?? [],
    });
    await audit({ action: 'esg.goal.create', entity: 'esg_goal', entityId: goal.id });
    return goal;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'esgPillar', 'baseline', 'targetValue', 'unit', 'currentValue', 'deadline', 'ownerId', 'progressPct', 'status', 'confidence', 'riskLevel', 'linkedSdgs']) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const goal = await esgGoalRepo.update(id, orgId, patch);
    if (!goal) throw new NotFoundError('ESG goal not found');
    await audit({ action: 'esg.goal.update', entity: 'esg_goal', entityId: id });
    return goal;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgGoalRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG goal not found');
    await esgGoalRepo.softDelete(id, orgId);
    await audit({ action: 'esg.goal.delete', entity: 'esg_goal', entityId: id });
    return { success: true };
  },

  async getProgress(orgId: string) {
    return esgGoalRepo.getProgress(orgId);
  },
};
