import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgReportingPeriodRepo } from '../repositories/esg-reporting-period.repo.js';

export const esgPeriodService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const periods = await esgReportingPeriodRepo.listByOrganization(orgId, {
      status: filter.status as string | undefined,
      periodType: filter.periodType as string | undefined,
    });
    return { periods, total: periods.length };
  },

  async get(orgId: string, id: string) {
    const period = await esgReportingPeriodRepo.findById(id, orgId);
    if (!period) throw new NotFoundError('Reporting period not found');
    return period;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const period = await esgReportingPeriodRepo.create({
      organizationId: orgId,
      name: input.name as string,
      periodType: input.periodType as string,
      startDate: input.startDate as string,
      endDate: input.endDate as string,
      dueDate: input.dueDate as string,
      frameworks: (input.frameworks as string[]) ?? [],
    });
    await audit({ action: 'esg.period.create', entity: 'esg_reporting_period', entityId: period.id });
    return period;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.status !== undefined) patch.status = input.status;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
    if (input.frameworks !== undefined) patch.frameworks = input.frameworks;
    const period = await esgReportingPeriodRepo.update(id, orgId, patch);
    if (!period) throw new NotFoundError('Reporting period not found');
    await audit({ action: 'esg.period.update', entity: 'esg_reporting_period', entityId: id });
    return period;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgReportingPeriodRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Reporting period not found');
    await esgReportingPeriodRepo.softDelete(id, orgId);
    await audit({ action: 'esg.period.delete', entity: 'esg_reporting_period', entityId: id });
    return { success: true };
  },
};
