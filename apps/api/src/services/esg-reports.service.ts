import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgReportRepo } from '../repositories/esg-report.repo.js';

export const esgReportService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    const reports = await esgReportRepo.listByOrganization(orgId, {
      periodId: filter.periodId as string | undefined,
      reportType: filter.reportType as string | undefined,
      status: filter.status as string | undefined,
      format: filter.format as string | undefined,
    });
    return { reports, total: reports.length };
  },

  async get(orgId: string, id: string) {
    const report = await esgReportRepo.findById(id, orgId);
    if (!report) throw new NotFoundError('ESG report not found');
    return report;
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const report = await esgReportRepo.create({
      organizationId: orgId,
      periodId: input.periodId as string,
      name: input.name as string,
      description: input.description as string | undefined,
      reportType: input.reportType as string,
      format: input.format as string,
      params: (input.params as Record<string, unknown>) ?? {},
    });
    await audit({ action: 'esg.report.create', entity: 'esg_report', entityId: report.id });
    return report;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.fileUrl !== undefined) patch.fileUrl = input.fileUrl;
    if (input.fileSizeBytes !== undefined) patch.fileSizeBytes = input.fileSizeBytes;
    if (input.pagesCount !== undefined) patch.pagesCount = input.pagesCount;
    if (input.summary !== undefined) patch.summary = input.summary;
    if (input.params !== undefined) patch.params = input.params;
    if (input.generatedBy !== undefined) patch.generatedBy = input.generatedBy;
    if (input.generatedAt !== undefined) patch.generatedAt = input.generatedAt;
    if (input.approvedBy !== undefined) patch.approvedBy = input.approvedBy;
    if (input.approvedAt !== undefined) patch.approvedAt = input.approvedAt;
    if (input.publishedAt !== undefined) patch.publishedAt = input.publishedAt;
    const report = await esgReportRepo.update(id, orgId, patch);
    if (!report) throw new NotFoundError('ESG report not found');
    await audit({ action: 'esg.report.update', entity: 'esg_report', entityId: id });
    return report;
  },

  async delete(orgId: string, id: string) {
    const existing = await esgReportRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('ESG report not found');
    await esgReportRepo.softDelete(id, orgId);
    await audit({ action: 'esg.report.delete', entity: 'esg_report', entityId: id });
    return { success: true };
  },
};
