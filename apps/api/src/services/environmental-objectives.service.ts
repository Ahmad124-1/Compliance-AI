import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { environmentalObjectiveRepo } from '../repositories/environmental-objective.repo.js';

export const environmentalObjectivesService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    return environmentalObjectiveRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      departmentId: filter.departmentId as string | undefined,
      objectiveType: filter.objectiveType as string | undefined,
      status: filter.status as string | undefined,
      priority: filter.priority as string | undefined,
    });
  },
  async get(orgId: string, id: string) {
    const objective = await environmentalObjectiveRepo.findById(id, orgId);
    if (!objective) throw new NotFoundError('Environmental objective not found');
    const milestones = await environmentalObjectiveRepo.listMilestonesByObjective(id);
    return { ...objective, milestones };
  },
  async create(orgId: string, input: Record<string, unknown>, userId?: string) {
    const objective = await environmentalObjectiveRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      parentObjectiveId: input.parentObjectiveId as string | undefined,
      linkedGoalId: input.linkedGoalId as string | undefined,
      linkedProgramId: input.linkedProgramId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      objectiveType: input.objectiveType as string,
      priority: input.priority as string | undefined,
      baselineValue: input.baselineValue as number | undefined,
      targetValue: input.targetValue as number,
      currentValue: input.currentValue as number | undefined,
      unit: input.unit as string | undefined,
      startDate: input.startDate as string,
      targetDate: input.targetDate as string,
      completionDate: input.completionDate as string | undefined,
      progressPct: input.progressPct as number | undefined,
      status: input.status as string | undefined,
      ownerId: input.ownerId as string | undefined,
      approvedBy: input.approvedBy as string | undefined,
      approvedAt: input.approvedAt as string | undefined,
      evidenceUrls: input.evidenceUrls as string[] | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'objective.create', entity: 'environmental_objective', entityId: objective.id, organizationId: orgId, actorId: userId });
    return objective;
  },
  async update(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','objectiveType','priority','baselineValue','targetValue','currentValue','unit','startDate','targetDate','completionDate','progressPct','status','ownerId','approvedBy','approvedAt','evidenceUrls','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const objective = await environmentalObjectiveRepo.update(id, orgId, patch as any);
    if (!objective) throw new NotFoundError('Environmental objective not found');
    await audit({ action: 'objective.update', entity: 'environmental_objective', entityId: id, organizationId: orgId, actorId: userId });
    return objective;
  },
  async delete(orgId: string, id: string, userId?: string) {
    const existing = await environmentalObjectiveRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Environmental objective not found');
    await environmentalObjectiveRepo.softDelete(id, orgId);
    await audit({ action: 'objective.delete', entity: 'environmental_objective', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // Milestones
  async createMilestone(objectiveId: string, input: Record<string, unknown>, userId?: string) {
    const milestone = await environmentalObjectiveRepo.createMilestone({
      objectiveId,
      name: input.name as string,
      description: input.description as string | undefined,
      targetValue: input.targetValue as number | undefined,
      currentValue: input.currentValue as number | undefined,
      targetDate: input.targetDate as string,
      completionDate: input.completionDate as string | undefined,
      status: input.status as string | undefined,
      ownerId: input.ownerId as string | undefined,
      sortOrder: input.sortOrder as number | undefined,
      notes: input.notes as string | undefined,
    });
    await audit({ action: 'objective.milestone.create', entity: 'objective_milestone', entityId: milestone.id, organizationId: null, actorId: userId });
    return milestone;
  },
  async listMilestones(objectiveId: string) {
    return environmentalObjectiveRepo.listMilestonesByObjective(objectiveId);
  },
  async updateMilestone(id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','targetValue','currentValue','targetDate','completionDate','status','ownerId','sortOrder','notes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const milestone = await environmentalObjectiveRepo.updateMilestone(id, patch as any);
    if (!milestone) throw new NotFoundError('Objective milestone not found');
    await audit({ action: 'objective.milestone.update', entity: 'objective_milestone', entityId: id, organizationId: null, actorId: userId });
    return milestone;
  },
  async deleteMilestone(id: string, userId?: string) {
    await environmentalObjectiveRepo.deleteMilestone(id);
    await audit({ action: 'objective.milestone.delete', entity: 'objective_milestone', entityId: id, organizationId: null, actorId: userId });
    return { success: true };
  },
};
