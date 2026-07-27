import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sustainabilityProgramRepo } from '../repositories/sustainability-program.repo.js';

export const sustainabilityProgramService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const page = (filter.page as number) ?? 1;
    const limit = (filter.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const programs = await sustainabilityProgramRepo.listByOrganization(orgId, {
      search: filter.search as string,
      category: filter.category as string,
      status: filter.status as string,
      departmentId: filter.departmentId as string,
    });
    const total = programs.length;
    const paginated = programs.slice(offset, offset + limit);
    const activeCount = programs.filter((p) => p.status === 'active').length;
    return { programs: paginated, total, page, limit, activeCount };
  },

  async get(orgId: string, id: string) {
    const program = await sustainabilityProgramRepo.findById(id, orgId);
    if (!program) throw new NotFoundError('Sustainability program not found');
    return program;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const program = await sustainabilityProgramRepo.create({
      organizationId: orgId,
      name: input.name as string,
      description: input.description as string | undefined,
      category: input.category as string,
      ownerId: input.ownerId as string | undefined,
      departmentId: input.departmentId as string | undefined,
      startDate: input.startDate as string | undefined,
      endDate: input.endDate as string | undefined,
      budget: input.budget as number | undefined,
      priority: (input.priority as string) ?? 'medium',
      linkedStandards: (input.linkedStandards as Record<string, unknown>[]) ?? [],
      linkedSdgs: (input.linkedSdgs as number[]) ?? [],
      linkedEsgPillars: (input.linkedEsgPillars as string[]) ?? [],
    });
    await audit({ action: 'sustainability.program.create', entity: 'sustainability_program', entityId: program.id });
    return program;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.category !== undefined) patch.category = input.category;
    if (input.ownerId !== undefined) patch.ownerId = input.ownerId;
    if (input.departmentId !== undefined) patch.departmentId = input.departmentId;
    if (input.startDate !== undefined) patch.startDate = input.startDate;
    if (input.endDate !== undefined) patch.endDate = input.endDate;
    if (input.budget !== undefined) patch.budget = input.budget;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.linkedStandards !== undefined) patch.linkedStandards = input.linkedStandards;
    if (input.linkedSdgs !== undefined) patch.linkedSdgs = input.linkedSdgs;
    if (input.linkedEsgPillars !== undefined) patch.linkedEsgPillars = input.linkedEsgPillars;
    if (input.status !== undefined) patch.status = input.status;
    const program = await sustainabilityProgramRepo.update(id, orgId, patch);
    if (!program) throw new NotFoundError('Sustainability program not found');
    await audit({ action: 'sustainability.program.update', entity: 'sustainability_program', entityId: id });
    return program;
  },

  async delete(orgId: string, id: string) {
    const existing = await sustainabilityProgramRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Sustainability program not found');
    await sustainabilityProgramRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.program.delete', entity: 'sustainability_program', entityId: id });
    return { success: true };
  },
};