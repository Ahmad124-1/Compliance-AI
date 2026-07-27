import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sustainabilityReportRepo } from '../repositories/sustainability-report.repo.js';

export const sustainabilityReportService = {
  async list(orgId: string, filter?: Record<string, unknown>) {
    const page = (filter?.page as number) ?? 1;
    const limit = (filter?.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const reports = await sustainabilityReportRepo.listByOrganization(orgId, {
      search: filter?.search as string,
      reportType: filter?.reportType as string,
      status: filter?.status as string,
      programId: filter?.programId as string,
    });
    const total = reports.length;
    const paginated = reports.slice(offset, offset + limit);
    return { reports: paginated, total, page, limit };
  },

  async get(orgId: string, id: string) {
    const report = await sustainabilityReportRepo.findById(id, orgId);
    if (!report) throw new NotFoundError('Report not found');
    return report;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const report = await sustainabilityReportRepo.create({
      organizationId: orgId,
      programId: input.programId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      reportType: input.reportType as string,
      format: (input.format as string) ?? 'pdf',
      generatedBy: input.generatedBy as string | undefined,
      params: (input.params as Record<string, unknown>) ?? {},
    });
    await audit({ action: 'sustainability.report.create', entity: 'sustainability_report', entityId: report.id });
    return report;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'status', 'fileUrl', 'summary', 'params']) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const report = await sustainabilityReportRepo.update(id, orgId, patch);
    if (!report) throw new NotFoundError('Report not found');
    await audit({ action: 'sustainability.report.update', entity: 'sustainability_report', entityId: id });
    return report;
  },

  async delete(orgId: string, id: string) {
    const existing = await sustainabilityReportRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Report not found');
    await sustainabilityReportRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.report.delete', entity: 'sustainability_report', entityId: id });
    return { success: true };
  },
};